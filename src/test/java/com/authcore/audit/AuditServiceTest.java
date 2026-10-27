package com.authcore.audit;

import com.authcore.audit.entity.AuditLog;
import com.authcore.audit.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditService(auditLogRepository);
    }

    @Test
    @DisplayName("recordEvent saves audit log entry")
    void recordEvent_SavesAuditLog() {
        UUID userId = UUID.randomUUID();
        auditService.recordEvent(userId, "TEST_ACTION", "192.168.1.1", "Chrome", "{\"test\":true}");

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("extractClientIp parses X-Forwarded-For header correctly")
    void extractClientIp_XForwardedFor() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.195, 70.41.3.18");

        String ip = AuditService.extractClientIp(request);
        assertEquals("203.0.113.195", ip);
    }

    @Test
    @DisplayName("extractClientIp falls back to getRemoteAddr when header is absent")
    void extractClientIp_RemoteAddrFallback() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.0.10");

        String ip = AuditService.extractClientIp(request);
        assertEquals("192.168.0.10", ip);
    }

    @Test
    @DisplayName("extractClientIp returns default when request is null")
    void extractClientIp_NullRequest() {
        String ip = AuditService.extractClientIp(null);
        assertEquals("127.0.0.1", ip);
    }
}
