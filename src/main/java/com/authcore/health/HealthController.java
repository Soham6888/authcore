package com.authcore.health;

import com.authcore.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@Tag(name = "System Health", description = "Service health checks — database and Redis connectivity status")
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

        // Redis is optional (fallback to in-memory). Only DB health gates the status.
        String message = dbHealthy ? "All systems operational" : "Degraded system state - Database unavailable";
        details.put("redisNote", redisHealthy ? null : "Redis unavailable - using in-memory fallback");

        return ResponseEntity
            .status(dbHealthy ? 200 : 503)
            .body(ApiResponse.success(message, details));
    }

    @GetMapping("/detailed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDetailedHealth() {
        Map<String, Object> details = new HashMap<>();
        boolean dbHealthy = checkDatabase();
        boolean redisHealthy = checkRedis();

        details.put("database", dbHealthy ? "UP" : "DOWN");
        details.put("redis", redisHealthy ? "UP" : "DOWN");
        details.put("jvmMemoryFreeBytes", Runtime.getRuntime().freeMemory());
        details.put("jvmMemoryTotalBytes", Runtime.getRuntime().totalMemory());
        details.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        details.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(ApiResponse.success("Detailed health metrics", details));
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
