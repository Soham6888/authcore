package com.authcore.role.dto;

import com.authcore.role.entity.Permission;
import com.authcore.role.entity.Role;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record RoleResponse(
    UUID id,
    String name,
    String description,
    boolean isSystem,
    Set<String> permissions
) {
    public static RoleResponse from(Role role) {
        return new RoleResponse(
            role.getId(),
            role.getName(),
            role.getDescription(),
            role.isSystem(),
            role.getPermissions().stream().map(Permission::getName).collect(Collectors.toSet())
        );
    }
}
