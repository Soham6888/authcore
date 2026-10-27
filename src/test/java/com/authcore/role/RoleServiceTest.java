package com.authcore.role;

import com.authcore.audit.AuditService;
import com.authcore.exception.ApiException;
import com.authcore.exception.DuplicateResourceException;
import com.authcore.role.dto.CreateRoleRequest;
import com.authcore.role.dto.RoleResponse;
import com.authcore.role.dto.UpdateRoleRequest;
import com.authcore.role.entity.Role;
import com.authcore.role.repository.PermissionRepository;
import com.authcore.role.repository.RoleRepository;
import com.authcore.role.service.RoleService;
import com.authcore.user.dto.UserDetailResponse;
import com.authcore.user.entity.User;
import com.authcore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PermissionRepository permissionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;

    private RoleService roleService;

    @BeforeEach
    void setUp() {
        roleService = new RoleService(
            roleRepository,
            permissionRepository,
            userRepository,
            auditService
        );
    }

    @Test
    @DisplayName("createRole with duplicate name throws DuplicateResourceException")
    void createRole_Duplicate_ThrowsException() {
        CreateRoleRequest request = new CreateRoleRequest("MANAGER", "Manager role", Set.of("users:read"));
        when(roleRepository.existsByName("MANAGER")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> roleService.createRole(request, null));
    }

    @Test
    @DisplayName("createRole saves and returns non-system role")
    void createRole_Success() {
        CreateRoleRequest request = new CreateRoleRequest("MANAGER", "Manager role", Set.of("users:read"));
        when(roleRepository.existsByName("MANAGER")).thenReturn(false);

        Role savedRole = new Role("MANAGER", "Manager role", false);
        savedRole.setId(UUID.randomUUID());
        when(roleRepository.save(any(Role.class))).thenReturn(savedRole);

        RoleResponse response = roleService.createRole(request, null);

        assertEquals("MANAGER", response.name());
        assertEquals(false, response.isSystem());
    }

    @Test
    @DisplayName("deleteRole on built-in system role throws BadRequest (BR-17)")
    void deleteRole_SystemRole_ThrowsException() {
        UUID roleId = UUID.randomUUID();
        Role systemRole = new Role("ADMIN", "Admin role", true);
        systemRole.setId(roleId);

        when(roleRepository.findById(roleId)).thenReturn(Optional.of(systemRole));

        ApiException ex = assertThrows(ApiException.class, () -> roleService.deleteRole(roleId, null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    @DisplayName("assignRoleToUser for ADMIN role by non-superadmin throws Forbidden (BR-20)")
    void assignRoleToUser_AdminRoleByNonSuperAdmin_ThrowsForbidden() {
        UUID userId = UUID.randomUUID();

        ApiException ex = assertThrows(ApiException.class,
            () -> roleService.assignRoleToUser(userId, "ADMIN", false, null));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    @DisplayName("assignRoleToUser for ADMIN role by superadmin succeeds (BR-20)")
    void assignRoleToUser_AdminRoleBySuperAdmin_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);
        Role adminRole = new Role("ADMIN", "Admin role", true);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDetailResponse response = roleService.assignRoleToUser(userId, "ADMIN", true, null);

        assertNotNull(response);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("removeRoleFromUser when user has only 1 role throws BadRequest (BR-16)")
    void removeRoleFromUser_LastRole_ThrowsBadRequest() {
        UUID userId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);
        Role userRole = new Role("USER", "User role", true);
        userRole.setId(roleId);
        user.setRoles(new HashSet<>(Set.of(userRole)));

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(userRole));

        ApiException ex = assertThrows(ApiException.class,
            () -> roleService.removeRoleFromUser(userId, roleId, true, null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    @DisplayName("getAllRoles returns all available roles")
    void getAllRoles_Success() {
        Role role = new Role("USER", "User role", true);
        when(roleRepository.findAll()).thenReturn(List.of(role));

        List<RoleResponse> roles = roleService.getAllRoles();

        assertEquals(1, roles.size());
        assertEquals("USER", roles.get(0).name());
    }

    @Test
    @DisplayName("getRoleById returns role when found")
    void getRoleById_Success() {
        UUID roleId = UUID.randomUUID();
        Role role = new Role("MODERATOR", "Mod", true);
        role.setId(roleId);

        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));

        RoleResponse response = roleService.getRoleById(roleId);
        assertEquals("MODERATOR", response.name());
    }

    @Test
    @DisplayName("updateRole updates description and permissions")
    void updateRole_Success() {
        UUID roleId = UUID.randomUUID();
        Role role = new Role("MODERATOR", "Old Mod", false);
        role.setId(roleId);

        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> i.getArgument(0));

        UpdateRoleRequest request = new UpdateRoleRequest("New Mod Description", Set.of("users:read"));
        RoleResponse response = roleService.updateRole(roleId, request, null);

        assertEquals("New Mod Description", response.description());
    }

    @Test
    @DisplayName("removeRoleFromUser removes role when user has multiple roles")
    void removeRoleFromUser_Success() {
        UUID userId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);

        Role role1 = new Role("USER", "User", true);
        role1.setId(roleId);
        Role role2 = new Role("MODERATOR", "Mod", false);
        role2.setId(UUID.randomUUID());
        user.setRoles(new HashSet<>(Set.of(role1, role2)));

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role1));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserDetailResponse response = roleService.removeRoleFromUser(userId, roleId, true, null);

        assertNotNull(response);
        assertEquals(1, user.getRoles().size());
    }
}
