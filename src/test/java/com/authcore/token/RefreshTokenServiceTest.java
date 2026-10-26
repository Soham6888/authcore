package com.authcore.token;

import com.authcore.exception.InvalidTokenException;
import com.authcore.token.entity.RefreshToken;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
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
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;
    private User testUser;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, 604800);

        testUser = new User("soham_dev", "soham@example.com", "hash", "Soham", "Patil");
        testUser.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Create refresh token persists hash and returns raw token")
    void createRefreshToken_Success() {
        when(refreshTokenRepository.findAllByUserIdAndRevokedFalseOrderByCreatedAtDesc(testUser.getId()))
            .thenReturn(new ArrayList<>());

        String rawToken = refreshTokenService.createRefreshToken(testUser, "Chrome / Windows", "127.0.0.1");

        assertNotNull(rawToken);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertEquals(testUser, saved.getUser());
        assertEquals(refreshTokenService.hashToken(rawToken), saved.getTokenHash());
        assertEquals("127.0.0.1", saved.getIpAddress());
        assertTrue(saved.isValid());
    }

    @Test
    @DisplayName("Rotate refresh token revokes old token and issues new token")
    void rotateRefreshToken_Success() {
        String oldRawToken = "old-raw-token-1234567890";
        String oldHash = refreshTokenService.hashToken(oldRawToken);
        RefreshToken existingToken = new RefreshToken(testUser, oldHash, "Device", "127.0.0.1", Instant.now().plusSeconds(3600));

        when(refreshTokenRepository.findByTokenHash(oldHash)).thenReturn(Optional.of(existingToken));
        when(refreshTokenRepository.findAllByUserIdAndRevokedFalseOrderByCreatedAtDesc(testUser.getId()))
            .thenReturn(new ArrayList<>());

        RefreshTokenService.RefreshTokenResult result = refreshTokenService.rotateRefreshToken(
            oldRawToken,
            "New Device",
            "192.168.1.1"
        );

        assertTrue(existingToken.isRevoked());
        assertNotNull(result.newRefreshToken());
        assertEquals(testUser, result.user());
    }

    @Test
    @DisplayName("Rotating an expired or revoked token throws InvalidTokenException")
    void rotateRefreshToken_Revoked_ThrowsException() {
        String rawToken = "revoked-token";
        String hash = refreshTokenService.hashToken(rawToken);
        RefreshToken revokedToken = new RefreshToken(testUser, hash, "Device", "127.0.0.1", Instant.now().plusSeconds(3600));
        revokedToken.revoke();

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(revokedToken));

        assertThrows(InvalidTokenException.class, () -> refreshTokenService.rotateRefreshToken(rawToken, "Device", "127.0.0.1"));
    }
}
