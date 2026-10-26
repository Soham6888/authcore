package com.authcore.audit.dto;

import com.authcore.audit.entity.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
    Long id,
    UUID userId,
    String action,
    String ipAddress,
    String userAgent,
    String metadata,
    Instant createdAt
) {
    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
            log.getId(),
            log.getUserId(),
            log.getAction(),
            log.getIpAddress(),
            log.getUserAgent(),
            log.getMetadata(),
            log.getCreatedAt()
        );
    }
}
