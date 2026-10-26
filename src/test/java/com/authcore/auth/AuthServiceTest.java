package com.authcore.auth;

import com.authcore.audit.AuditService;
import com.authcore.auth.dto.AuthResponse;
import com.authcore.auth.dto.ChangePasswordRequest;
import com.authcore.auth.dto.ForgotPasswordRequest;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.auth.dto.ResetPasswordRequest;
import com.authcore.auth.dto.UserSummaryResponse;
import com.authcore.auth.service.AuthService;
import com.authcore.exception.AccountLockedException;
import com.authcore.exception.AccountSuspendedException;
import com.authcore.exception.DuplicateResourceException;
import com.authcore.exception.InvalidCredentialsException;
import com.authcore.exception.InvalidPasswordException;
import com.authcore.exception.RateLimitExceededException;
import com.authcore.ratelimit.RateLimitService;
import com.authcore.role.entity.Role;
import com.authcore.role.repository.RoleRepository;
import com.authcore.token.JwtService;
import com.authcore.token.RefreshTokenService;
import com.authcore.token.TokenBlacklistService;
import com.authcore.token.entity.PasswordResetToken;
import com.authcore.token.repository.PasswordResetTokenRepository;
import com.authcore.user.entity.PasswordHistory;
import com.authcore.user.entity.User;
import com.authcore.user.entity.UserStatus;
import com.authcore.user.repository.PasswordHistoryRepository;
import com.authcore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AuditService auditService;
    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private TokenBlacklistService tokenBlacklistService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
            userRepository,
            roleRepository,
            passwordHistoryRepository,
            passwordResetTokenRepository,
            passwordEncoder,
            jwtService,
            refreshTokenService,
            auditService,
            rateLimitService,
            tokenBlacklistService
        );
    }

    @Test
    @DisplayName("Register new user successfully hashes password and saves user")
    void register_Success() {
        RegisterRequest request = new RegisterRequest("soham_dev", "soham@example.com", "SecureP@ss123", "Soham", "Patil");

        when(userRepository.existsByEmailIgnoreCase(request.email())).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase(request.username())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("encoded-password-hash");

        Role userRole = new Role("USER", "Standard User", true);
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(userRole));

        User savedUser = new User(request.username(), request.email(), "encoded-password-hash", request.firstName(), request.lastName());
        savedUser.setId(UUID.randomUUID());
        savedUser.setRoles(java.util.Collections.singleton(userRole));

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserSummaryResponse response = authService.register(request, null);

        assertNotNull(response);
        assertEquals("soham_dev", response.username());
        assertEquals("soham@example.com", response.email());
        verify(passwordHistoryRepository).save(any());
        verify(auditService).logSecurityAction(any(), anyString(), any(), any());
    }

    @Test
    @DisplayName("Register with duplicate email throws DuplicateResourceException")
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest("soham_dev", "existing@example.com", "SecureP@ss123", "Soham", "Patil");
        when(userRepository.existsByEmailIgnoreCase(request.email())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request, null));
    }

    @Test
    @DisplayName("Login with valid credentials returns access and refresh tokens")
    void login_Success() {
        LoginRequest request = new LoginRequest("soham@example.com", "SecureP@ss123");
        User user = new User("soham_dev", "soham@example.com", "encoded-hash", "Soham", "Patil");
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmailIgnoreCase("soham@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SecureP@ss123", "encoded-hash")).thenReturn(true);
        when(jwtService.generateAccessToken(user)).thenReturn("access-token-jwt");
        when(refreshTokenService.createRefreshToken(any(), any(), any())).thenReturn("raw-refresh-token");
        when(jwtService.getExpirationSeconds()).thenReturn(900L);

        AuthResponse response = authService.login(request, null);

        assertNotNull(response);
        assertEquals("access-token-jwt", response.accessToken());
        assertEquals("raw-refresh-token", response.refreshToken());
        assertEquals("Bearer", response.tokenType());
    }

    @Test
    @DisplayName("Login with incorrect password throws InvalidCredentialsException and records failed attempt")
    void login_BadPassword_ThrowsException() {
        LoginRequest request = new LoginRequest("soham@example.com", "WrongPassword123!");
        User user = new User("soham_dev", "soham@example.com", "encoded-hash", "Soham", "Patil");
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmailIgnoreCase("soham@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword123!", "encoded-hash")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request, null));
        verify(rateLimitService).recordFailedLogin(user.getId());
    }

    @Test
    @DisplayName("Login when IP rate limit is exceeded throws RateLimitExceededException")
    void login_IpRateLimitExceeded_ThrowsException() {
        LoginRequest request = new LoginRequest("soham@example.com", "SecureP@ss123");
        doThrow(new RateLimitExceededException("Too many login attempts from this IP address."))
            .when(rateLimitService).checkIpRateLimit(any());

        assertThrows(RateLimitExceededException.class, () -> authService.login(request, null));
    }

    @Test
    @DisplayName("Login when account is locked throws AccountLockedException")
    void login_AccountLocked_ThrowsException() {
        LoginRequest request = new LoginRequest("soham@example.com", "SecureP@ss123");
        User user = new User("soham_dev", "soham@example.com", "encoded-hash", "Soham", "Patil");
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmailIgnoreCase("soham@example.com")).thenReturn(Optional.of(user));
        doThrow(new AccountLockedException("Account is temporarily locked."))
            .when(rateLimitService).checkAccountLock(user.getId());

        assertThrows(AccountLockedException.class, () -> authService.login(request, null));
    }

    @Test
    @DisplayName("Login by suspended user throws AccountSuspendedException")
    void login_SuspendedUser_ThrowsException() {
        LoginRequest request = new LoginRequest("soham@example.com", "SecureP@ss123");
        User user = new User("soham_dev", "soham@example.com", "encoded-hash", "Soham", "Patil");
        user.setId(UUID.randomUUID());
        user.setStatus(UserStatus.SUSPENDED);

        when(userRepository.findByEmailIgnoreCase("soham@example.com")).thenReturn(Optional.of(user));

        assertThrows(AccountSuspendedException.class, () -> authService.login(request, null));
    }

    @Test
    @DisplayName("ForgotPassword generates reset token when user exists")
    void forgotPassword_UserExists_GeneratesToken() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("soham@example.com");
        User user = new User("soham_dev", "soham@example.com", "hash", "Soham", "Patil");
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmailIgnoreCase("soham@example.com")).thenReturn(Optional.of(user));
        when(refreshTokenService.hashToken(anyString())).thenReturn("hashed-reset-token");

        String token = authService.forgotPassword(request, null);

        assertNotNull(token);
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    @DisplayName("ResetPassword rejects if new password matches one of last 5 passwords (BR-09)")
    void resetPassword_ReusesOldPassword_ThrowsInvalidPasswordException() {
        ResetPasswordRequest request = new ResetPasswordRequest("valid-token", "NewSecure@Pass123");
        User user = new User("soham_dev", "soham@example.com", "hash", "Soham", "Patil");
        user.setId(UUID.randomUUID());

        PasswordResetToken resetToken = new PasswordResetToken(user, "hashed-token", Instant.now().plusSeconds(900));

        when(refreshTokenService.hashToken("valid-token")).thenReturn("hashed-token");
        when(passwordResetTokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(resetToken));

        PasswordHistory oldHistory = new PasswordHistory(user, "old-hash-1");
        when(passwordHistoryRepository.findTop5ByUserIdOrderByCreatedAtDesc(user.getId()))
            .thenReturn(List.of(oldHistory));
        when(passwordEncoder.matches("NewSecure@Pass123", "old-hash-1")).thenReturn(true);

        assertThrows(InvalidPasswordException.class, () -> authService.resetPassword(request, null));
    }

    @Test
    @DisplayName("ChangePassword succeeds when current password is valid and new password not in history")
    void changePassword_Success() {
        UUID userId = UUID.randomUUID();
        ChangePasswordRequest request = new ChangePasswordRequest("OldPassword@123", "BrandNew@Pass123");
        User user = new User("soham_dev", "soham@example.com", "old-encoded-hash", "Soham", "Patil");
        user.setId(userId);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword@123", "old-encoded-hash")).thenReturn(true);
        when(passwordHistoryRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId))
            .thenReturn(Collections.emptyList());
        when(passwordEncoder.encode("BrandNew@Pass123")).thenReturn("new-encoded-hash");

        authService.changePassword(userId, request, null);

        assertEquals("new-encoded-hash", user.getPasswordHash());
        verify(passwordHistoryRepository).save(any(PasswordHistory.class));
    }
}
