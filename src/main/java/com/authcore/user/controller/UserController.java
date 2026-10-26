package com.authcore.user.controller;

import com.authcore.audit.dto.AuditLogResponse;
import com.authcore.common.ApiResponse;
import com.authcore.common.PageResponse;
import com.authcore.role.dto.AssignRoleRequest;
import com.authcore.role.service.RoleService;
import com.authcore.user.dto.UpdateProfileRequest;
import com.authcore.user.dto.UpdateUserStatusRequest;
import com.authcore.user.dto.UserDetailResponse;
import com.authcore.user.dto.UserSessionResponse;
import com.authcore.user.entity.UserStatus;
import com.authcore.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final RoleService roleService;

    public UserController(UserService userService, RoleService roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('users:read')")
    public ResponseEntity<ApiResponse<PageResponse<UserDetailResponse>>> listUsers(
        @RequestParam(required = false) UserStatus status,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        String sortProp = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProp));

        PageResponse<UserDetailResponse> response = userService.getUsers(status, role, query, pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetailResponse>> getUserById(
        @PathVariable UUID id,
        Authentication authentication
    ) {
        checkAdminOrSelf(id, authentication);
        UserDetailResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetailResponse>> updateProfile(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateProfileRequest request,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        checkAdminOrSelf(id, authentication);
        UserDetailResponse response = userService.updateProfile(id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
        @PathVariable UUID id,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        checkAdminOrSelf(id, authentication);
        userService.softDeleteUser(id, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('users:status')")
    public ResponseEntity<ApiResponse<UserDetailResponse>> updateUserStatus(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateUserStatusRequest request,
        HttpServletRequest httpRequest
    ) {
        UserDetailResponse response = userService.updateUserStatus(id, request.status(), httpRequest);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", response));
    }

    @GetMapping("/{id}/sessions")
    public ResponseEntity<ApiResponse<List<UserSessionResponse>>> getUserSessions(
        @PathVariable UUID id,
        Authentication authentication
    ) {
        checkAdminOrSelf(id, authentication);
        List<UserSessionResponse> response = userService.getUserSessions(id);
        return ResponseEntity.ok(ApiResponse.success("Active sessions retrieved successfully", response));
    }

    @DeleteMapping("/{id}/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> revokeUserSession(
        @PathVariable UUID id,
        @PathVariable UUID sessionId,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        checkAdminOrSelf(id, authentication);
        userService.revokeUserSession(id, sessionId, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Session revoked successfully", null));
    }

    @GetMapping("/{id}/audit-logs")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('audit:read')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getUserAuditLogs(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<AuditLogResponse> response = userService.getUserAuditLogs(id, pageable);
        return ResponseEntity.ok(ApiResponse.success("User audit logs retrieved successfully", response));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('users:write')")
    public ResponseEntity<ApiResponse<UserDetailResponse>> assignRoleToUser(
        @PathVariable UUID id,
        @Valid @RequestBody AssignRoleRequest request,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        boolean isSuperAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        UserDetailResponse response = roleService.assignRoleToUser(id, request.roleName(), isSuperAdmin, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Role assigned to user successfully", response));
    }

    @DeleteMapping("/{id}/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('users:write')")
    public ResponseEntity<ApiResponse<UserDetailResponse>> removeRoleFromUser(
        @PathVariable UUID id,
        @PathVariable UUID roleId,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        boolean isSuperAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        UserDetailResponse response = roleService.removeRoleFromUser(id, roleId, isSuperAdmin, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Role removed from user successfully", response));
    }

    private void checkAdminOrSelf(UUID targetUserId, Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        UUID currentUserId = (UUID) authentication.getPrincipal();
        if (!isAdmin && !targetUserId.equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to access or modify this resource");
        }
    }
}
