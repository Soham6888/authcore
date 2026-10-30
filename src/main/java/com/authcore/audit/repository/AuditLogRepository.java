package com.authcore.audit.repository;

import com.authcore.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:userId IS NULL OR a.userId = :userId)
          AND (:action IS NULL OR a.action = :action)
        ORDER BY a.createdAt DESC
    """)
    Page<AuditLog> searchAuditLogs(@Param("userId") UUID userId, @Param("action") String action, Pageable pageable);

    @Modifying
    @Query("UPDATE AuditLog a SET a.archived = true WHERE a.createdAt < :cutoff AND a.archived = false")
    int archiveOldLogs(@Param("cutoff") java.time.Instant cutoff);

    @Modifying
    @Query("UPDATE AuditLog a SET a.userId = null, a.metadata = '{\"anonymized\": true}' WHERE a.userId = :userId")
    int anonymizeLogsForUser(@Param("userId") UUID userId);
}
