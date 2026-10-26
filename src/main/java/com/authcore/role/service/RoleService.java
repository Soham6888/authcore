package com.authcore.role.service;

import com.authcore.audit.AuditService;
import com.authcore.exception.ApiException;
import com.authcore.exception.DuplicateResourceException;
import com.authcore.exception.ResourceNotFoundException;
import com.authcore.role.dto.CreateRoleRequest;
import com.authcore.role.dto.RoleResponse;
import com.authcore.role.dto.UpdateRoleRequest;
import com.authcore.role.entity.Permission;
import com.authcore.role.entity.Role;
import com.authcore.role.repository.PermissionRepository;
import com.authcore.role.repository.RoleRepository;
import com.authcore.user.dto.UserDetailResponse;
import com.authcore.user.entity.User;
import com.authcore.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public RoleService(
        RoleRepository roleRepository,
        PermissionRepository permissionRepository,
        UserRepository userRepository,
        AuditService auditService
    ) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
            .map(RoleResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse getRoleById(UUID id) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        return RoleResponse.from(role);
    }

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request, HttpServletRequest httpRequest) {
        String roleName = request.name().trim().toUpperCase();
        if (roleRepository.existsByName(roleName)) {
            throw new DuplicateResourceException("Role with name " + roleName + " already exists");
        }

        Role role = new Role(roleName, request.description(), false);

        if (request.permissions() != null && !request.permissions().isEmpty()) {
            Set<Permission> permissions = new HashSet<>();
            for (String permName : request.permissions()) {
                permissionRepository.findByName(permName.trim())
                    .ifPresent(permissions::add);
            }
            role.setPermissions(permissions);
        }

        Role saved = roleRepository.save(role);
        auditService.logSecurityAction(null, "ROLE_CREATED", httpRequest, "{\"roleName\":\"" + roleName + "\"}");

        return RoleResponse.from(saved);
    }

    @Transactional
    public RoleResponse updateRole(UUID id, UpdateRoleRequest request, HttpServletRequest httpRequest) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        if (request.description() != null) {
            role.setDescription(request.description().trim());
        }

        if (request.permissions() != null) {
            Set<Permission> permissions = new HashSet<>();
            for (String permName : request.permissions()) {
                permissionRepository.findByName(permName.trim())
                    .ifPresent(permissions::add);
            }
            role.setPermissions(permissions);
        }

        Role updated = roleRepository.save(role);
        auditService.logSecurityAction(null, "ROLE_UPDATED", httpRequest, "{\"roleName\":\"" + role.getName() + "\"}");

        return RoleResponse.from(updated);
    }

    @Transactional
    public void deleteRole(UUID id, HttpServletRequest httpRequest) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        // BR-17: Built-in system roles cannot be deleted
        if (role.isSystem()) {
            throw new ApiException("Built-in system roles cannot be deleted", HttpStatus.BAD_REQUEST);
        }

        roleRepository.delete(role);
        auditService.logSecurityAction(null, "ROLE_DELETED", httpRequest, "{\"roleName\":\"" + role.getName() + "\"}");
    }

    @Transactional
    public UserDetailResponse assignRoleToUser(UUID userId, String roleName, boolean isSuperAdmin, HttpServletRequest httpRequest) {
        // BR-20: Only SUPER_ADMIN can assign ADMIN or SUPER_ADMIN role
        String normalizedRoleName = roleName.trim().toUpperCase();
        if (("ADMIN".equalsIgnoreCase(normalizedRoleName) || "SUPER_ADMIN".equalsIgnoreCase(normalizedRoleName)) && !isSuperAdmin) {
            throw new ApiException("Only SUPER_ADMIN can assign administrative roles", HttpStatus.FORBIDDEN);
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role role = roleRepository.findByName(normalizedRoleName)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + normalizedRoleName));

        user.addRole(role);
        User savedUser = userRepository.save(user);

        auditService.logSecurityAction(userId, "ROLE_ASSIGNED", httpRequest, "{\"assignedRole\":\"" + normalizedRoleName + "\"}");
        return UserDetailResponse.from(savedUser);
    }

    @Transactional
    public UserDetailResponse removeRoleFromUser(UUID userId, UUID roleId, boolean isSuperAdmin, HttpServletRequest httpRequest) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        // BR-16: User must have at least one role
        if (user.getRoles().size() <= 1) {
            throw new ApiException("User must have at least one role assigned", HttpStatus.BAD_REQUEST);
        }

        // BR-20: Only SUPER_ADMIN can remove ADMIN or SUPER_ADMIN
        if (("ADMIN".equalsIgnoreCase(role.getName()) || "SUPER_ADMIN".equalsIgnoreCase(role.getName())) && !isSuperAdmin) {
            throw new ApiException("Only SUPER_ADMIN can remove administrative roles", HttpStatus.FORBIDDEN);
        }

        user.removeRole(role);
        User savedUser = userRepository.save(user);

        auditService.logSecurityAction(userId, "ROLE_REMOVED", httpRequest, "{\"removedRole\":\"" + role.getName() + "\"}");
        return UserDetailResponse.from(savedUser);
    }
}
