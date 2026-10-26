package com.authcore.token;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private static final String BLACKLIST_KEY_PREFIX = "token:blacklist:";

    private final StringRedisTemplate redisTemplate;
    private final Map<String, Instant> localBlacklistFallback = new ConcurrentHashMap<>();

    public TokenBlacklistService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void blacklistToken(String jti, long remainingSeconds) {
        if (jti == null || jti.isBlank() || remainingSeconds <= 0) {
            return;
        }

        String key = BLACKLIST_KEY_PREFIX + jti;
        try {
            if (redisTemplate != null) {
                redisTemplate.opsForValue().set(key, "revoked", Duration.ofSeconds(remainingSeconds));
                return;
            }
        } catch (Exception e) {
            log.warn("Redis unavailable for token blacklisting, falling back to in-memory store: {}", e.getMessage());
        }

        localBlacklistFallback.put(jti, Instant.now().plusSeconds(remainingSeconds));
    }

    public boolean isBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }

        String key = BLACKLIST_KEY_PREFIX + jti;
        try {
            if (redisTemplate != null) {
                Boolean hasKey = redisTemplate.hasKey(key);
                return Boolean.TRUE.equals(hasKey);
            }
        } catch (Exception e) {
            log.warn("Redis unavailable for blacklist check, falling back to in-memory store: {}", e.getMessage());
        }

        Instant expiry = localBlacklistFallback.get(jti);
        if (expiry == null) {
            return false;
        }
        if (Instant.now().isAfter(expiry)) {
            localBlacklistFallback.remove(jti);
            return false;
        }
        return true;
    }
}
