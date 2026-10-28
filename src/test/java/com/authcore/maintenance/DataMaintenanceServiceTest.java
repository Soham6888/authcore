package com.authcore.maintenance;

import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.token.repository.PasswordResetTokenRepository;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.user.entity.User;
import com.authcore.user.repository.PasswordHistoryRepository;
import com.authcore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataMaintenanceServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;

    private DataMaintenanceService maintenanceService;

    @BeforeEach
    void setUp() {
        maintenanceService = new DataMaintenanceService(
            refreshTokenRepository,
            passwordResetTokenRepository,
            auditLogRepository,
            userRepository,
            passwordHistoryRepository
        );
    }

    @Test
    @DisplayName("executeAllMaintenance should prune expired tokens, archive logs, and hard-delete 30-day soft-deleted users")
    void executeAllMaintenance_Success() {
        // Arrange
        when(refreshTokenRepository.deleteExpiredAndRevokedTokens(any(Instant.class), any(Instant.class)))
            .thenReturn(15);
        when(passwordResetTokenRepository.deleteExpiredOrUsedTokens(any(Instant.class)))
            .thenReturn(4);
        when(auditLogRepository.archiveOldLogs(any(Instant.class)))
            .thenReturn(42);

        User softDeletedUser = new User("deleteduser", "del@authcore.io", "hash", "Old", "User");
        UUID userId = UUID.randomUUID();
        softDeletedUser.setId(userId);

        when(userRepository.findAllByDeletedAtBefore(any(Instant.class)))
            .thenReturn(List.of(softDeletedUser));
        when(auditLogRepository.anonymizeLogsForUser(eq(userId)))
            .thenReturn(3);

        // Act
        DataMaintenanceService.MaintenanceSummary summary = maintenanceService.executeAllMaintenance();

        // Assert
        assertNotNull(summary);
        assertEquals(15, summary.purgedRefreshTokens());
        assertEquals(4, summary.purgedResetTokens());
        assertEquals(42, summary.archivedAuditLogs());
        assertEquals(1, summary.hardDeletedUsers());
        assertEquals(3, summary.anonymizedAuditLogs());

        verify(refreshTokenRepository).deleteAllByUserId(userId);
        verify(passwordResetTokenRepository).deleteAllByUserId(userId);
        verify(passwordHistoryRepository).deleteAllByUserId(userId);
        verify(userRepository).delete(softDeletedUser);
    }
}
