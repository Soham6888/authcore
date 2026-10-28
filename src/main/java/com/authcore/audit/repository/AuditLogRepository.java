package com.authcore.audit.repository;

import com.authcore.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AuditLog a SET a.archived = true WHERE a.createdAt < :cutoff AND a.archived = false")
    int archiveOldLogs(@org.springframework.data.repository.query.Param("cutoff") java.time.Instant cutoff);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AuditLog a SET a.userId = null, a.metadata = '{\"anonymized\": true}' WHERE a.userId = :userId")
    int anonymizeLogsForUser(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
