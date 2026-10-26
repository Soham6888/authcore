package com.authcore.auth.controller;

import com.authcore.auth.dto.AuthResponse;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RefreshTokenRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.auth.dto.UserSummaryResponse;
import com.authcore.auth.service.AuthService;
import com.authcore.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest
    ) {
        UserSummaryResponse response = authService.register(request, httpRequest);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
        @Valid @RequestBody RefreshTokenRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.refreshToken(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
        @RequestBody(required = false) RefreshTokenRequest request,
        HttpServletRequest httpRequest
    ) {
        String token = request != null ? request.refreshToken() : null;
        authService.logout(token, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll(
        @AuthenticationPrincipal UUID userId,
        HttpServletRequest httpRequest
    ) {
        authService.logoutAll(userId, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Logged out from all devices", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getCurrentUser(
        @AuthenticationPrincipal UUID userId
    ) {
        UserSummaryResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", response));
    }
}
