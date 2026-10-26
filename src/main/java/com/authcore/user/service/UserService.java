package com.authcore.user.service;

import com.authcore.audit.AuditService;
import com.authcore.audit.dto.AuditLogResponse;
import com.authcore.audit.entity.AuditLog;
import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.common.PageResponse;
import com.authcore.exception.ResourceNotFoundException;
import com.authcore.token.entity.RefreshToken;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.user.dto.UpdateProfileRequest;
import com.authcore.user.dto.UserDetailResponse;
import com.authcore.user.dto.UserSessionResponse;
import com.authcore.user.entity.User;
import com.authcore.user.entity.UserStatus;
import com.authcore.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    public UserService(
        UserRepository userRepository,
        RefreshTokenRepository refreshTokenRepository,
        AuditLogRepository auditLogRepository,
        AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDetailResponse> getUsers(
        UserStatus status,
        String role,
        String query,
        Pageable pageable
    ) {
        Page<User> usersPage = userRepository.searchUsers(status, role, query, pageable);
        Page<UserDetailResponse> dtoPage = usersPage.map(UserDetailResponse::from);
        return PageResponse.from(dtoPage);
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(UUID id) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDetailResponse.from(user);
    }

    @Transactional
    public UserDetailResponse updateProfile(UUID id, UpdateProfileRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName().trim());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName().trim());
        }

        User updatedUser = userRepository.save(user);
        auditService.logSecurityAction(id, "USER_PROFILE_UPDATED", httpRequest, "{\"updatedFields\":\"firstName,lastName\"}");

        return UserDetailResponse.from(updatedUser);
    }

    @Transactional
    public void softDeleteUser(UUID id, HttpServletRequest httpRequest) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setDeletedAt(Instant.now());
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);

        // Revoke all active sessions
        refreshTokenRepository.revokeAllByUserId(id, Instant.now());
        auditService.logSecurityAction(id, "USER_DELETED", httpRequest, "{\"type\":\"SOFT_DELETE\"}");
    }

    @Transactional
    public UserDetailResponse updateUserStatus(UUID id, UserStatus newStatus, HttpServletRequest httpRequest) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setStatus(newStatus);
        User updated = userRepository.save(user);

        // If inactive or suspended, revoke all active sessions immediately
        if (newStatus == UserStatus.SUSPENDED || newStatus == UserStatus.INACTIVE) {
            refreshTokenRepository.revokeAllByUserId(id, Instant.now());
        }

        auditService.logSecurityAction(id, "USER_STATUS_UPDATED", httpRequest, "{\"newStatus\":\"" + newStatus + "\"}");
        return UserDetailResponse.from(updated);
    }

    @Transactional(readOnly = true)
    public List<UserSessionResponse> getUserSessions(UUID id) {
        // Verify user exists
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }

        List<RefreshToken> sessions = refreshTokenRepository.findAllByUserIdAndRevokedFalseOrderByCreatedAtDesc(id);
        return sessions.stream()
            .map(UserSessionResponse::from)
            .toList();
    }

    @Transactional
    public void revokeUserSession(UUID userId, UUID sessionId, HttpServletRequest httpRequest) {
        RefreshToken token = refreshTokenRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        if (!token.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Session not found for user: " + userId);
        }

        token.setRevoked(true);
        token.setRevokedAt(Instant.now());
        refreshTokenRepository.save(token);

        auditService.logSecurityAction(userId, "SESSION_REVOKED", httpRequest, "{\"sessionId\":\"" + sessionId + "\"}");
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getUserAuditLogs(UUID userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        Page<AuditLog> page = auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.from(page.map(AuditLogResponse::from));
    }
}
