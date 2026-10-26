package com.authcore.ratelimit;

import com.authcore.exception.AccountLockedException;
import com.authcore.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RateLimitServiceTest {

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        // Test fallback store (redisTemplate = null) to verify rate-limiting logic in-memory
        rateLimitService = new RateLimitService(null);
    }

    @Test
    @DisplayName("BR-21: IP rate limit allows up to 5 attempts, blocks 6th")
    void checkIpRateLimit_Enforces5AttemptsPerIp() {
        String ip = "192.168.1.50";

        for (int i = 1; i <= 5; i++) {
            assertDoesNotThrow(() -> rateLimitService.checkIpRateLimit(ip));
        }

        assertThrows(RateLimitExceededException.class, () -> rateLimitService.checkIpRateLimit(ip));
    }

    @Test
    @DisplayName("BR-22: Consecutive failed login attempts trigger account lock at 5 attempts")
    void recordFailedLogin_LocksAccountAt5Attempts() {
        UUID userId = UUID.randomUUID();

        // 4 failed attempts should not lock yet
        for (int i = 1; i <= 4; i++) {
            assertDoesNotThrow(() -> rateLimitService.recordFailedLogin(userId));
            assertDoesNotThrow(() -> rateLimitService.checkAccountLock(userId));
        }

        // 5th failed attempt triggers lock
        assertThrows(AccountLockedException.class, () -> rateLimitService.recordFailedLogin(userId));
        // Subsequent checks should throw AccountLockedException
        assertThrows(AccountLockedException.class, () -> rateLimitService.checkAccountLock(userId));
    }

    @Test
    @DisplayName("resetFailedLogins clears the failed attempts counter")
    void resetFailedLogins_ClearsLock() {
        UUID userId = UUID.randomUUID();

        for (int i = 1; i <= 4; i++) {
            rateLimitService.recordFailedLogin(userId);
        }

        rateLimitService.resetFailedLogins(userId);

        // Can attempt again without locking immediately
        assertDoesNotThrow(() -> rateLimitService.checkAccountLock(userId));
        assertDoesNotThrow(() -> rateLimitService.recordFailedLogin(userId));
    }

    @Test
    @DisplayName("BR-24: Password reset allows up to 3 requests per hour, blocks 4th")
    void checkPasswordResetRateLimit_Enforces3Requests() {
        String email = "test@example.com";

        for (int i = 1; i <= 3; i++) {
            assertDoesNotThrow(() -> rateLimitService.checkPasswordResetRateLimit(email));
        }

        assertThrows(RateLimitExceededException.class, () -> rateLimitService.checkPasswordResetRateLimit(email));
    }
}
