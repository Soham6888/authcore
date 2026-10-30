package com.authcore.audit;

import com.authcore.audit.dto.AuditLogResponse;
import com.authcore.audit.entity.AuditLog;
import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.common.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(UUID userId, String action, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.searchAuditLogs(userId, action, pageable);
        return PageResponse.from(page.map(AuditLogResponse::from));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(UUID userId, String action, String ipAddress, String userAgent, String metadata) {
        AuditLog log = new AuditLog(userId, action, ipAddress, userAgent, metadata);
        auditLogRepository.save(log);
    }

    public void logSecurityAction(UUID userId, String action, HttpServletRequest request, String metadata) {
        String ip = extractClientIp(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : "System";
        recordEvent(userId, action, ip, userAgent, metadata);
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
