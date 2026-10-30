package com.authcore.auth.service;

import com.authcore.audit.AuditService;
import com.authcore.auth.dto.AuthResponse;
import com.authcore.auth.dto.ChangePasswordRequest;
import com.authcore.auth.dto.ForgotPasswordRequest;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RefreshTokenRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.auth.dto.ResetPasswordRequest;
import com.authcore.auth.dto.UserSummaryResponse;
import com.authcore.common.PasswordValidator;
import com.authcore.exception.AccountSuspendedException;
import com.authcore.exception.DuplicateResourceException;
import com.authcore.exception.InvalidCredentialsException;
import com.authcore.exception.InvalidPasswordException;
import com.authcore.exception.InvalidPasswordResetTokenException;
import com.authcore.exception.InvalidTokenException;
import com.authcore.exception.ResourceNotFoundException;
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
import com.authcore.user.repository.PasswordHistoryRepository;
import com.authcore.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final RateLimitService rateLimitService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordHistoryRepository passwordHistoryRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        RefreshTokenService refreshTokenService,
        AuditService auditService,
        RateLimitService rateLimitService,
        TokenBlacklistService tokenBlacklistService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordHistoryRepository = passwordHistoryRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
        this.rateLimitService = rateLimitService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Transactional
    public UserSummaryResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("An account with this email address already exists");
        }
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new DuplicateResourceException("An account with this username already exists");
        }

        PasswordValidator.validate(request.password());

        String encodedPassword = passwordEncoder.encode(request.password());
        User user = new User(
            request.username().trim(),
            request.email().trim().toLowerCase(),
            encodedPassword,
            request.firstName(),
            request.lastName()
        );

        Role defaultRole = roleRepository.findByName("USER")
            .orElseGet(() -> roleRepository.save(new Role("USER", "Standard registered application user", true)));
        user.setRoles(Collections.singleton(defaultRole));

        User savedUser = userRepository.save(user);

        // Record password in history (BR-09)
        passwordHistoryRepository.save(new PasswordHistory(savedUser, encodedPassword));

        // Audit log (BR-25, BR-26)
        auditService.logSecurityAction(savedUser.getId(), "USER_REGISTERED", httpRequest, "{\"username\":\"" + savedUser.getUsername() + "\"}");

        return UserSummaryResponse.from(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = AuditService.extractClientIp(httpRequest);
        rateLimitService.checkIpRateLimit(clientIp);

        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> {
                auditService.logSecurityAction(null, "LOGIN_FAILED", httpRequest, "{\"email\":\"" + request.email() + "\",\"reason\":\"USER_NOT_FOUND\"}");
                return new InvalidCredentialsException("Invalid email or password");
            });

        // BR-22: Check account lock
        rateLimitService.checkAccountLock(user.getId());

        if (user.isSuspended()) {
            auditService.logSecurityAction(user.getId(), "LOGIN_BLOCKED", httpRequest, "{\"reason\":\"ACCOUNT_SUSPENDED\"}");
            throw new AccountSuspendedException("Your account has been suspended. Please contact support.");
        }

        if (!user.isActive()) {
            auditService.logSecurityAction(user.getId(), "LOGIN_BLOCKED", httpRequest, "{\"reason\":\"ACCOUNT_INACTIVE\"}");
            throw new InvalidCredentialsException("Your account is not active.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditService.logSecurityAction(user.getId(), "LOGIN_FAILED", httpRequest, "{\"reason\":\"BAD_CREDENTIALS\"}");
            rateLimitService.recordFailedLogin(user.getId());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Reset failed login counter on success
        rateLimitService.resetFailedLogins(user.getId());

        String deviceInfo = httpRequest != null ? httpRequest.getHeader("User-Agent") : "Unknown";
        String ipAddress = clientIp;

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo, ipAddress);

        auditService.logSecurityAction(user.getId(), "LOGIN_SUCCESS", httpRequest, "{\"device\":\"" + deviceInfo + "\"}");

        return AuthResponse.of(accessToken, refreshToken, jwtService.getExpirationSeconds());
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        String deviceInfo = httpRequest != null ? httpRequest.getHeader("User-Agent") : "Unknown";
        String ipAddress = AuditService.extractClientIp(httpRequest);

        RefreshTokenService.RefreshTokenResult result = refreshTokenService.rotateRefreshToken(
            request.refreshToken(),
            deviceInfo,
            ipAddress
        );

        String newAccessToken = jwtService.generateAccessToken(result.user());
        auditService.logSecurityAction(result.user().getId(), "TOKEN_REFRESHED", httpRequest, null);

        return AuthResponse.of(newAccessToken, result.newRefreshToken(), jwtService.getExpirationSeconds());
    }

    @Transactional
    public void logout(String refreshToken, HttpServletRequest httpRequest) {
        String authHeader = httpRequest != null ? httpRequest.getHeader("Authorization") : null;
        logout(refreshToken, authHeader, httpRequest);
    }

    @Transactional
    public void logout(String refreshToken, String authHeader, HttpServletRequest httpRequest) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeToken(refreshToken);
        }
        blacklistBearerToken(authHeader);
        auditService.logSecurityAction(null, "LOGOUT", httpRequest, null);
    }

    @Transactional
    public void logoutAll(UUID userId, HttpServletRequest httpRequest) {
        String authHeader = httpRequest != null ? httpRequest.getHeader("Authorization") : null;
        logoutAll(userId, authHeader, httpRequest);
    }

    @Transactional
    public void logoutAll(UUID userId, String authHeader, HttpServletRequest httpRequest) {
        refreshTokenService.revokeAllUserTokens(userId);
        blacklistBearerToken(authHeader);
        auditService.logSecurityAction(userId, "LOGOUT_ALL", httpRequest, null);
    }

    private void blacklistBearerToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String jti = jwtService.extractJti(token);
                Date expiry = jwtService.extractExpiration(token);
                if (jti != null && expiry != null) {
                    long remainingSeconds = Math.max(0, (expiry.getTime() - System.currentTimeMillis()) / 1000);
                    tokenBlacklistService.blacklistToken(jti, remainingSeconds);
                }
            } catch (Exception ignored) {
            }
        }
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserSummaryResponse.from(user);
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        rateLimitService.checkPasswordResetRateLimit(request.email());

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(request.email().trim());
        if (userOpt.isEmpty()) {
            auditService.logSecurityAction(null, "PASSWORD_RESET_REQUESTED", httpRequest, "{\"email\":\"" + request.email() + "\",\"found\":false}");
            return null;
        }

        User user = userOpt.get();
        String rawToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        String tokenHash = refreshTokenService.hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        PasswordResetToken resetToken = new PasswordResetToken(user, tokenHash, expiresAt);
        passwordResetTokenRepository.save(resetToken);

        auditService.logSecurityAction(user.getId(), "PASSWORD_RESET_REQUESTED", httpRequest, "{\"email\":\"" + user.getEmail() + "\"}");
        return rawToken;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        PasswordValidator.validate(request.newPassword());

        String tokenHash = refreshTokenService.hashToken(request.token().trim());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new InvalidPasswordResetTokenException("Invalid or expired password reset token"));

        if (!resetToken.isValid()) {
            throw new InvalidPasswordResetTokenException("Invalid or expired password reset token");
        }

        User user = resetToken.getUser();

        // BR-09: Password history check (cannot reuse last 5 passwords)
        List<PasswordHistory> historyList = passwordHistoryRepository.findTop5ByUserIdOrderByCreatedAtDesc(user.getId());
        for (PasswordHistory history : historyList) {
            if (passwordEncoder.matches(request.newPassword(), history.getPasswordHash())) {
                throw new InvalidPasswordException("New password cannot be one of your last 5 passwords");
            }
        }

        String encodedNewPassword = passwordEncoder.encode(request.newPassword());
        user.setPasswordHash(encodedNewPassword);
        userRepository.save(user);

        resetToken.setUsed(true);
        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        passwordHistoryRepository.save(new PasswordHistory(user, encodedNewPassword));
        refreshTokenService.revokeAllUserTokens(user.getId());

        auditService.logSecurityAction(user.getId(), "PASSWORD_RESET_SUCCESS", httpRequest, null);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            auditService.logSecurityAction(userId, "PASSWORD_CHANGE_FAILED", httpRequest, "{\"reason\":\"INVALID_CURRENT_PASSWORD\"}");
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        PasswordValidator.validate(request.newPassword());

        // BR-09: Password history check
        List<PasswordHistory> historyList = passwordHistoryRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
        for (PasswordHistory history : historyList) {
            if (passwordEncoder.matches(request.newPassword(), history.getPasswordHash())) {
                throw new InvalidPasswordException("New password cannot be one of your last 5 passwords");
            }
        }

        String encodedNewPassword = passwordEncoder.encode(request.newPassword());
        user.setPasswordHash(encodedNewPassword);
        userRepository.save(user);

        passwordHistoryRepository.save(new PasswordHistory(user, encodedNewPassword));
        auditService.logSecurityAction(userId, "PASSWORD_CHANGED", httpRequest, null);
    }
}
