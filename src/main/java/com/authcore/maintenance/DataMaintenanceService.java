package com.authcore.maintenance;

import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.token.repository.PasswordResetTokenRepository;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.user.entity.User;
import com.authcore.user.repository.PasswordHistoryRepository;
import com.authcore.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DataMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(DataMaintenanceService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;

    public DataMaintenanceService(
        RefreshTokenRepository refreshTokenRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        AuditLogRepository auditLogRepository,
        UserRepository userRepository,
        PasswordHistoryRepository passwordHistoryRepository
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.passwordHistoryRepository = passwordHistoryRepository;
    }

    /**
     * Nightly scheduled maintenance job executing at 02:00 AM server time.
     */
    @Scheduled(cron = "${authcore.maintenance.cron:0 0 2 * * ?}")
    public void runNightlyMaintenance() {
        log.info("Starting scheduled nightly data maintenance and GDPR lifecycle job...");
        MaintenanceSummary summary = executeAllMaintenance();
        log.info("Nightly maintenance completed: {}", summary);
    }

    /**
     * Executes all data maintenance tasks and returns a report.
     */
    @Transactional
    public MaintenanceSummary executeAllMaintenance() {
        Instant now = Instant.now();

        // 1. Purge expired and old revoked refresh tokens (cutoff: expired before now, revoked > 7 days ago)
        Instant revokedCutoff = now.minus(7, ChronoUnit.DAYS);
        int purgedRefreshTokens = refreshTokenRepository.deleteExpiredAndRevokedTokens(now, revokedCutoff);

        // 2. Purge expired or used password reset tokens (cutoff: expired before now)
        int purgedResetTokens = passwordResetTokenRepository.deleteExpiredOrUsedTokens(now);

        // 3. Archive audit logs older than 90 days (PRD BR-28)
        Instant auditCutoff = now.minus(90, ChronoUnit.DAYS);
        int archivedLogs = auditLogRepository.archiveOldLogs(auditCutoff);

        // 4. Hard delete users soft-deleted for > 30 days and anonymize audit logs (PRD BR-30)
        Instant gdprCutoff = now.minus(30, ChronoUnit.DAYS);
        List<User> usersToPurge = userRepository.findAllByDeletedAtBefore(gdprCutoff);
        int hardDeletedUsers = 0;
        int anonymizedLogs = 0;

        for (User user : usersToPurge) {
            // Anonymize audit logs referencing this user
            anonymizedLogs += auditLogRepository.anonymizeLogsForUser(user.getId());

            // Delete dependent records
            passwordHistoryRepository.deleteAllByUserId(user.getId());
            passwordResetTokenRepository.deleteAllByUserId(user.getId());
            refreshTokenRepository.deleteAllByUserId(user.getId());

            // Clear roles join table
            user.getRoles().clear();
            userRepository.save(user);

            // Hard delete user
            userRepository.delete(user);
            hardDeletedUsers++;
        }

        return new MaintenanceSummary(
            purgedRefreshTokens,
            purgedResetTokens,
            archivedLogs,
            hardDeletedUsers,
            anonymizedLogs,
            now
        );
    }

    public record MaintenanceSummary(
        int purgedRefreshTokens,
        int purgedResetTokens,
        int archivedAuditLogs,
        int hardDeletedUsers,
        int anonymizedAuditLogs,
        Instant executedAt
    ) {}
}
