package com.authcore.token;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenBlacklistServiceTest {

    private TokenBlacklistService blacklistService;

    @BeforeEach
    void setUp() {
        blacklistService = new TokenBlacklistService(null);
    }

    @Test
    @DisplayName("Blacklisted token ID is recognized as blacklisted")
    void blacklistToken_RecognizedAsBlacklisted() {
        String jti = UUID.randomUUID().toString();

        assertFalse(blacklistService.isBlacklisted(jti));

        blacklistService.blacklistToken(jti, 300);

        assertTrue(blacklistService.isBlacklisted(jti));
    }

    @Test
    @DisplayName("Non-blacklisted or blank token ID returns false")
    void isBlacklisted_BlankOrNonExistent_ReturnsFalse() {
        assertFalse(blacklistService.isBlacklisted(null));
        assertFalse(blacklistService.isBlacklisted(""));
        assertFalse(blacklistService.isBlacklisted("non-existent-jti"));
    }
}
