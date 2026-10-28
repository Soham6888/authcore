package com.authcore.user.repository;

import com.authcore.user.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, UUID> {

    List<PasswordHistory> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM PasswordHistory p WHERE p.user.id = :userId")
    void deleteAllByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
