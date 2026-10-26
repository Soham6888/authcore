package com.authcore.health;

import com.authcore.common.ApiResponse;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final DataSource dataSource;
    private final RedisTemplate<String, Object> redisTemplate;

    public HealthController(DataSource dataSource, RedisTemplate<String, Object> redisTemplate) {
        this.dataSource = dataSource;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealth() {
        Map<String, Object> details = new HashMap<>();
        boolean dbHealthy = checkDatabase();
        boolean redisHealthy = checkRedis();

        details.put("database", dbHealthy ? "UP" : "DOWN");
        details.put("redis", redisHealthy ? "UP" : "DOWN");
        details.put("timestamp", Instant.now().toString());

        boolean allUp = dbHealthy && redisHealthy;
        String message = allUp ? "All systems operational" : "Degraded system state";

        return ResponseEntity
            .status(allUp ? 200 : 503)
            .body(ApiResponse.success(message, details));
    }

    private boolean checkDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkRedis() {
        try {
            RedisConnection connection = redisTemplate.getConnectionFactory().getConnection();
            String ping = connection.ping();
            return "PONG".equalsIgnoreCase(ping);
        } catch (Exception e) {
            return false;
        }
    }
}
