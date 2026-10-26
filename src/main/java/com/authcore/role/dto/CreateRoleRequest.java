package com.authcore.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateRoleRequest(
    @NotBlank(message = "Role name is required")
    @Size(min = 2, max = 50, message = "Role name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Role name must be uppercase letters, numbers, and underscores only")
    String name,

    @Size(max = 255, message = "Description must not exceed 255 characters")
    String description,

    Set<String> permissions
) {}
