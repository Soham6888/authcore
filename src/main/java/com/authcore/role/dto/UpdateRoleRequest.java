package com.authcore.role.dto;

import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateRoleRequest(
    @Size(max = 255, message = "Description must not exceed 255 characters")
    String description,

    Set<String> permissions
) {}
