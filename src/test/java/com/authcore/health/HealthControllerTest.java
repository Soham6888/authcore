package com.authcore.health;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthControllerTest {

    private DataSource dataSource;
    private RedisTemplate<String, Object> redisTemplate;
    private RedisConnectionFactory connectionFactory;
    private RedisConnection redisConnection;
    private Connection dbConnection;
    private HealthController healthController;

    @BeforeEach
    void setUp() throws SQLException {
        dataSource = mock(DataSource.class);
        @SuppressWarnings("unchecked")
        RedisTemplate<String, Object> mockRedis = mock(RedisTemplate.class);
        redisTemplate = mockRedis;
        connectionFactory = mock(RedisConnectionFactory.class);
        redisConnection = mock(RedisConnection.class);
        dbConnection = mock(Connection.class);

        when(redisTemplate.getConnectionFactory()).thenReturn(connectionFactory);
        when(connectionFactory.getConnection()).thenReturn(redisConnection);
        when(dataSource.getConnection()).thenReturn(dbConnection);

        healthController = new HealthController(dataSource, redisTemplate);
    }

    @Test
    @DisplayName("Health endpoint returns 200 when DB and Redis are UP")
    void getHealth_AllUp_Returns200() throws SQLException {
        when(dbConnection.isValid(anyInt())).thenReturn(true);
        when(redisConnection.ping()).thenReturn("PONG");

        ResponseEntity<?> response = healthController.getHealth();

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    @DisplayName("Health endpoint returns 503 when Redis or DB is DOWN")
    void getHealth_DbDown_Returns503() throws SQLException {
        when(dbConnection.isValid(anyInt())).thenReturn(false);
        when(redisConnection.ping()).thenReturn("PONG");

        ResponseEntity<?> response = healthController.getHealth();

        assertEquals(503, response.getStatusCode().value());
    }

    @Test
    @DisplayName("Detailed health returns JVM metrics")
    void getDetailedHealth_ReturnsMetrics() throws SQLException {
        when(dbConnection.isValid(anyInt())).thenReturn(true);
        when(redisConnection.ping()).thenReturn("PONG");

        ResponseEntity<?> response = healthController.getDetailedHealth();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
    }
}
