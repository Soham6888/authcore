package com.authcore.token;

import com.authcore.exception.InvalidTokenException;
import com.authcore.token.entity.RefreshToken;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final int MAX_SESSIONS_PER_USER = 5;
    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenExpirationSeconds;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
        RefreshTokenRepository refreshTokenRepository,
        @Value("${authcore.jwt.refresh-token-expiration-seconds:604800}") long refreshTokenExpirationSeconds
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenExpirationSeconds = refreshTokenExpirationSeconds;
    }

    @Transactional
    public String createRefreshToken(User user, String deviceInfo, String ipAddress) {
        enforceMaxSessions(user.getId());

        String rawToken = generateSecureRandomToken();
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plusSeconds(refreshTokenExpirationSeconds);

        RefreshToken refreshToken = new RefreshToken(user, tokenHash, deviceInfo, ipAddress, expiresAt);
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    @Transactional
    public RefreshTokenResult rotateRefreshToken(String rawToken, String deviceInfo, String ipAddress) {
        String tokenHash = hashToken(rawToken);
        RefreshToken existingToken = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (!existingToken.isValid()) {
            throw new InvalidTokenException("Refresh token is expired or has been revoked");
        }

        // Revoke the old token (Single-use token rotation policy)
        existingToken.revoke();
        refreshTokenRepository.save(existingToken);

        User user = existingToken.getUser();
        if (!user.isActive()) {
            throw new InvalidTokenException("User account is inactive or suspended");
        }

        // Issue new token
        String newRawToken = createRefreshToken(user, deviceInfo, ipAddress);
        return new RefreshTokenResult(user, newRawToken);
    }

    @Transactional
    public void revokeToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.revoke();
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    private void enforceMaxSessions(UUID userId) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByUserIdAndRevokedFalseOrderByCreatedAtDesc(userId);
        if (activeTokens.size() >= MAX_SESSIONS_PER_USER) {
            // Revoke oldest active sessions so total is less than MAX_SESSIONS_PER_USER
            int excess = activeTokens.size() - MAX_SESSIONS_PER_USER + 1;
            for (int i = activeTokens.size() - excess; i < activeTokens.size(); i++) {
                RefreshToken oldToken = activeTokens.get(i);
                oldToken.revoke();
                refreshTokenRepository.save(oldToken);
            }
        }
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String generateSecureRandomToken() {
        byte[] randomBytes = new byte[64];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public record RefreshTokenResult(User user, String newRefreshToken) {}
}
