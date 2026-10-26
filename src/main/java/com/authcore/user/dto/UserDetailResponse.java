package com.authcore.user.dto;

import com.authcore.role.entity.Role;
import com.authcore.user.entity.User;
import com.authcore.user.entity.UserStatus;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record UserDetailResponse(
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    UserStatus status,
    boolean emailVerified,
    Set<String> roles,
    Instant createdAt,
    Instant updatedAt
) {
    public static UserDetailResponse from(User user) {
        return new UserDetailResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getStatus(),
            user.isEmailVerified(),
            user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
