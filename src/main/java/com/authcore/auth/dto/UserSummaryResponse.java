package com.authcore.auth.dto;

import com.authcore.role.entity.Role;
import com.authcore.user.entity.User;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record UserSummaryResponse(
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    String status,
    boolean emailVerified,
    Set<String> roles,
    Instant createdAt
) {
    public static UserSummaryResponse from(User user) {
        Set<String> roleNames = user.getRoles().stream()
            .map(Role::getName)
            .collect(Collectors.toSet());

        return new UserSummaryResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getStatus().name(),
            user.isEmailVerified(),
            roleNames,
            user.getCreatedAt()
        );
    }
}
