package com.authcore.auth.service;

import com.authcore.audit.AuditService;
import com.authcore.auth.dto.AuthResponse;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RefreshTokenRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.auth.dto.UserSummaryResponse;
import com.authcore.common.PasswordValidator;
import com.authcore.exception.AccountSuspendedException;
import com.authcore.exception.DuplicateResourceException;
import com.authcore.exception.InvalidCredentialsException;
import com.authcore.exception.ResourceNotFoundException;
import com.authcore.role.entity.Role;
import com.authcore.role.repository.RoleRepository;
import com.authcore.token.JwtService;
import com.authcore.token.RefreshTokenService;
import com.authcore.user.entity.PasswordHistory;
import com.authcore.user.entity.User;
import com.authcore.user.repository.PasswordHistoryRepository;
import com.authcore.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordHistoryRepository passwordHistoryRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        RefreshTokenService refreshTokenService,
        AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordHistoryRepository = passwordHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
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
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> {
                auditService.logSecurityAction(null, "LOGIN_FAILED", httpRequest, "{\"email\":\"" + request.email() + "\",\"reason\":\"USER_NOT_FOUND\"}");
                return new InvalidCredentialsException("Invalid email or password");
            });

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
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String deviceInfo = httpRequest != null ? httpRequest.getHeader("User-Agent") : "Unknown";
        String ipAddress = AuditService.extractClientIp(httpRequest);

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
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeToken(refreshToken);
        }
        auditService.logSecurityAction(null, "LOGOUT", httpRequest, null);
    }

    @Transactional
    public void logoutAll(UUID userId, HttpServletRequest httpRequest) {
        refreshTokenService.revokeAllUserTokens(userId);
        auditService.logSecurityAction(userId, "LOGOUT_ALL", httpRequest, null);
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserSummaryResponse.from(user);
    }
}
