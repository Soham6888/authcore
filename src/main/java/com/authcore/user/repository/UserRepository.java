package com.authcore.user.repository;

import com.authcore.user.entity.User;
import com.authcore.user.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    Page<User> findAllByDeletedAtIsNull(Pageable pageable);

    Optional<User> findByIdAndDeletedAtIsNull(UUID id);

    java.util.List<User> findAllByDeletedAtBefore(java.time.Instant cutoff);

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN u.roles r
        WHERE u.deletedAt IS NULL
          AND (:status IS NULL OR u.status = :status)
          AND (:roleName IS NULL OR LOWER(r.name) = LOWER(:roleName))
          AND (:query IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
    """)
    Page<User> searchUsers(
        @Param("status") UserStatus status,
        @Param("roleName") String roleName,
        @Param("query") String query,
        Pageable pageable
    );
}
