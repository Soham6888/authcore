package com.authcore.user;

import com.authcore.audit.AuditService;
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
import com.authcore.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private AuditService auditService;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
            userRepository,
            refreshTokenRepository,
            auditLogRepository,
            auditService
        );
    }

    @Test
    @DisplayName("getUserById returns user details when user exists")
    void getUserById_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));

        UserDetailResponse response = userService.getUserById(userId);

        assertEquals("testuser", response.username());
        assertEquals("test@example.com", response.email());
    }

    @Test
    @DisplayName("getUserById throws ResourceNotFoundException when user does not exist")
    void getUserById_NotFound_ThrowsException() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(userId));
    }

    @Test
    @DisplayName("updateProfile updates names and triggers audit log")
    void updateProfile_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "OldFirst", "OldLast");
        user.setId(userId);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest("NewFirst", "NewLast");
        UserDetailResponse response = userService.updateProfile(userId, request, null);

        assertEquals("NewFirst", response.firstName());
        assertEquals("NewLast", response.lastName());
        verify(auditService).logSecurityAction(eq(userId), eq("USER_PROFILE_UPDATED"), any(), any());
    }

    @Test
    @DisplayName("softDeleteUser sets deletedAt and revokes all active sessions (FR-13)")
    void softDeleteUser_SetsDeletedAtAndRevokesSessions() {
        UUID userId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));

        userService.softDeleteUser(userId, null);

        assertTrue(user.isDeleted());
        assertEquals(UserStatus.INACTIVE, user.getStatus());
        verify(refreshTokenRepository).revokeAllByUserId(eq(userId), any(Instant.class));
        verify(auditService).logSecurityAction(eq(userId), eq("USER_DELETED"), any(), any());
    }

    @Test
    @DisplayName("updateUserStatus to SUSPENDED revokes all active sessions (FR-14)")
    void updateUserStatus_Suspended_RevokesSessions() {
        UUID userId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDetailResponse response = userService.updateUserStatus(userId, UserStatus.SUSPENDED, null);

        assertEquals(UserStatus.SUSPENDED, response.status());
        verify(refreshTokenRepository).revokeAllByUserId(eq(userId), any(Instant.class));
        verify(auditService).logSecurityAction(eq(userId), eq("USER_STATUS_UPDATED"), any(), any());
    }

    @Test
    @DisplayName("getUserSessions returns active non-revoked sessions (FR-15)")
    void getUserSessions_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);

        RefreshToken token = new RefreshToken(user, "token-hash", "Chrome on Windows", "127.0.0.1", Instant.now().plusSeconds(3600));
        token.setId(UUID.randomUUID());

        when(userRepository.existsById(userId)).thenReturn(true);
        when(refreshTokenRepository.findAllByUserIdAndRevokedFalseOrderByCreatedAtDesc(userId))
            .thenReturn(List.of(token));

        List<UserSessionResponse> sessions = userService.getUserSessions(userId);

        assertEquals(1, sessions.size());
        assertEquals("Chrome on Windows", sessions.get(0).deviceInfo());
    }

    @Test
    @DisplayName("revokeUserSession revokes specific session (FR-16)")
    void revokeUserSession_Success() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(userId);

        RefreshToken token = new RefreshToken(user, "token-hash", "Device", "127.0.0.1", Instant.now().plusSeconds(3600));
        token.setId(sessionId);

        when(refreshTokenRepository.findById(sessionId)).thenReturn(Optional.of(token));

        userService.revokeUserSession(userId, sessionId, null);

        assertTrue(token.isRevoked());
        verify(refreshTokenRepository).save(token);
        verify(auditService).logSecurityAction(eq(userId), eq("SESSION_REVOKED"), any(), any());
    }

    @Test
    @DisplayName("getUsers returns paginated list of users")
    void getUsers_ReturnsPaginatedUsers() {
        User user = new User("testuser", "test@example.com", "hash", "Test", "User");
        user.setId(UUID.randomUUID());
        Page<User> page = new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1);

        when(userRepository.searchUsers(any(), any(), any(), any())).thenReturn(page);

        PageResponse<UserDetailResponse> response = userService.getUsers(null, null, null, PageRequest.of(0, 10));

        assertEquals(1, response.content().size());
        assertEquals("testuser", response.content().get(0).username());
    }

    @Test
    @DisplayName("getUserAuditLogs returns paginated audit entries")
    void getUserAuditLogs_Success() {
        UUID userId = UUID.randomUUID();
        when(userRepository.existsById(userId)).thenReturn(true);

        com.authcore.audit.entity.AuditLog log = new com.authcore.audit.entity.AuditLog(userId, "LOGIN_SUCCESS", "127.0.0.1", "Agent", null);
        Page<com.authcore.audit.entity.AuditLog> page = new PageImpl<>(List.of(log), PageRequest.of(0, 10), 1);
        when(auditLogRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any())).thenReturn(page);

        PageResponse<com.authcore.audit.dto.AuditLogResponse> response = userService.getUserAuditLogs(userId, PageRequest.of(0, 10));

        assertEquals(1, response.content().size());
        assertEquals("LOGIN_SUCCESS", response.content().get(0).action());
    }

    @Test
    @DisplayName("getUserAuditLogs throws ResourceNotFoundException if user does not exist")
    void getUserAuditLogs_UserNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.existsById(userId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserAuditLogs(userId, PageRequest.of(0, 10)));
    }
}
