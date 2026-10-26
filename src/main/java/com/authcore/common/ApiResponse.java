package com.authcore.common;

import java.time.Instant;

public record ApiResponse<T>(
    Instant timestamp,
    int status,
    String message,
    T data,
    String correlationId
) {
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(Instant.now(), 200, message, data, null);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(Instant.now(), 201, message, data, null);
    }

    public static <T> ApiResponse<T> error(int status, String message, String correlationId) {
        return new ApiResponse<>(Instant.now(), status, message, null, correlationId);
    }
}
