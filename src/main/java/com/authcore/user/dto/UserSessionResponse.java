package com.authcore.user.dto;

import com.authcore.token.entity.RefreshToken;

import java.time.Instant;
import java.util.UUID;

public record UserSessionResponse(
    UUID id,
    String deviceInfo,
    String ipAddress,
    Instant createdAt,
    Instant expiresAt
) {
    public static UserSessionResponse from(RefreshToken token) {
        return new UserSessionResponse(
            token.getId(),
            token.getDeviceInfo(),
            token.getIpAddress(),
            token.getCreatedAt(),
            token.getExpiresAt()
        );
    }
}
