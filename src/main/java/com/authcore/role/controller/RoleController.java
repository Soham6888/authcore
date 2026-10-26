package com.authcore.role.controller;

import com.authcore.common.ApiResponse;
import com.authcore.role.dto.CreateRoleRequest;
import com.authcore.role.dto.RoleResponse;
import com.authcore.role.dto.UpdateRoleRequest;
import com.authcore.role.service.RoleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('roles:read')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> listRoles() {
        List<RoleResponse> response = roleService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('roles:read')")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable UUID id) {
        RoleResponse response = roleService.getRoleById(id);
        return ResponseEntity.ok(ApiResponse.success("Role retrieved successfully", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('roles:write')")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(
        @Valid @RequestBody CreateRoleRequest request,
        HttpServletRequest httpRequest
    ) {
        RoleResponse response = roleService.createRole(request, httpRequest);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created("Role created successfully", response));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateRoleRequest request,
        HttpServletRequest httpRequest
    ) {
        RoleResponse response = roleService.updateRole(id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRole(
        @PathVariable UUID id,
        HttpServletRequest httpRequest
    ) {
        roleService.deleteRole(id, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully", null));
    }
}
