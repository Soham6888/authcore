package com.authcore.ratelimit;

import com.authcore.exception.AccountLockedException;
import com.authcore.exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);

    public static final String IP_LOGIN_PREFIX = "rate:login:ip:";
    public static final String ACCT_LOCK_PREFIX = "rate:login:acct:";
    public static final String PW_RESET_PREFIX = "rate:pwreset:";

    public static final int MAX_IP_LOGIN_ATTEMPTS = 5;
    public static final Duration IP_WINDOW = Duration.ofMinutes(15);

    public static final int MAX_FAILED_ACCOUNT_ATTEMPTS = 5;
    public static final Duration ACCOUNT_LOCK_DURATION = Duration.ofMinutes(30);

    public static final int MAX_PW_RESET_ATTEMPTS = 3;
    public static final Duration PW_RESET_WINDOW = Duration.ofHours(1);

    private final StringRedisTemplate redisTemplate;

    // Fallback cache when Redis is unavailable
    private record CacheEntry(long count, Instant expiresAt) {}
    private final Map<String, CacheEntry> fallbackStore = new ConcurrentHashMap<>();

    public RateLimitService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * BR-21: Login attempts are rate-limited to 5 attempts per IP per 15 minutes.
     */
    public void checkIpRateLimit(String ip) {
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            return;
        }

        String key = IP_LOGIN_PREFIX + ip;
        long count = incrementWithExpiry(key, IP_WINDOW);

        if (count > MAX_IP_LOGIN_ATTEMPTS) {
            log.warn("Rate limit exceeded for IP: {} (count: {})", ip, count);
            throw new RateLimitExceededException("Too many login attempts from this IP address. Please try again in 15 minutes.");
        }
    }

    /**
     * BR-22: Check if account is temporarily locked (5 consecutive failed login attempts).
     */
    public void checkAccountLock(UUID userId) {
        if (userId == null) {
            return;
        }

        String key = ACCT_LOCK_PREFIX + userId;
        long failedCount = getCurrentCount(key);

        if (failedCount >= MAX_FAILED_ACCOUNT_ATTEMPTS) {
            log.warn("Account {} is locked due to {} consecutive failed attempts", userId, failedCount);
            throw new AccountLockedException("Account is temporarily locked due to too many failed attempts. Try again in 30 minutes.");
        }
    }

    /**
     * Record a failed login attempt for account and check if threshold reached.
     */
    public void recordFailedLogin(UUID userId) {
        if (userId == null) {
            return;
        }

        String key = ACCT_LOCK_PREFIX + userId;
        long failedCount = incrementWithExpiry(key, ACCOUNT_LOCK_DURATION);

        if (failedCount >= MAX_FAILED_ACCOUNT_ATTEMPTS) {
            log.warn("Account {} reached {} failed login attempts. Locking for 30 minutes.", userId, failedCount);
            throw new AccountLockedException("Account is temporarily locked due to too many failed attempts. Try again in 30 minutes.");
        }
    }

    /**
     * Reset consecutive failed login counter upon successful login.
     */
    public void resetFailedLogins(UUID userId) {
        if (userId == null) {
            return;
        }

        String key = ACCT_LOCK_PREFIX + userId;
        try {
            if (redisTemplate != null) {
                redisTemplate.delete(key);
                return;
            }
        } catch (Exception e) {
            log.warn("Redis delete failed for account lock key {}: {}", key, e.getMessage());
        }

        fallbackStore.remove(key);
    }

    /**
     * BR-24: Password reset requests are rate-limited to 3 per email per hour.
     */
    public void checkPasswordResetRateLimit(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        String key = PW_RESET_PREFIX + email.trim().toLowerCase();
        long count = incrementWithExpiry(key, PW_RESET_WINDOW);

        if (count > MAX_PW_RESET_ATTEMPTS) {
            log.warn("Password reset rate limit exceeded for email: {} (count: {})", email, count);
            throw new RateLimitExceededException("Too many password reset requests for this email. Please try again in 1 hour.");
        }
    }

    private long incrementWithExpiry(String key, Duration ttl) {
        try {
            if (redisTemplate != null) {
                Long count = redisTemplate.opsForValue().increment(key);
                if (count != null && count == 1) {
                    redisTemplate.expire(key, ttl);
                }
                return count != null ? count : 1;
            }
        } catch (Exception e) {
            log.warn("Redis increment failed for key {}, using in-memory fallback: {}", key, e.getMessage());
        }

        // In-memory fallback
        Instant now = Instant.now();
        CacheEntry entry = fallbackStore.compute(key, (k, existing) -> {
            if (existing == null || now.isAfter(existing.expiresAt())) {
                return new CacheEntry(1, now.plus(ttl));
            }
            return new CacheEntry(existing.count() + 1, existing.expiresAt());
        });

        return entry.count();
    }

    private long getCurrentCount(String key) {
        try {
            if (redisTemplate != null) {
                String val = redisTemplate.opsForValue().get(key);
                if (val != null) {
                    return Long.parseLong(val);
                }
                return 0;
            }
        } catch (Exception e) {
            log.warn("Redis get failed for key {}, checking in-memory fallback: {}", key, e.getMessage());
        }

        Instant now = Instant.now();
        CacheEntry entry = fallbackStore.get(key);
        if (entry != null && now.isBefore(entry.expiresAt())) {
            return entry.count();
        }
        if (entry != null) {
            fallbackStore.remove(key);
        }
        return 0;
    }
}
