package com.authcore.e2e;

import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.auth.dto.ChangePasswordRequest;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RefreshTokenRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.auth.dto.ResetPasswordRequest;
import com.authcore.ratelimit.RateLimitService;
import com.authcore.role.repository.RoleRepository;
import com.authcore.token.entity.PasswordResetToken;
import com.authcore.token.repository.PasswordResetTokenRepository;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.token.RefreshTokenService;
import com.authcore.user.entity.User;
import com.authcore.user.entity.UserStatus;
import com.authcore.user.repository.PasswordHistoryRepository;
import com.authcore.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@DisplayName("E2E Authentication Flow Tests (PRD Section 9.4)")
public class AuthFlowE2ETest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private RateLimitService rateLimitService;

    @Value("${authcore.jwt.secret}")
    private String jwtSecret;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final AtomicInteger ipCounter = new AtomicInteger(100);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
            .apply(springSecurity())
            .build();

        rateLimitService.clearAllLimits();
        passwordResetTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        passwordHistoryRepository.deleteAll();
        auditLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String nextClientIp() {
        return "192.168.1." + ipCounter.incrementAndGet();
    }

    @Test
    @DisplayName("Scenario 1: Register -> Login -> hit protected endpoint -> All 200")
    void test1_registerLoginAndAccessProtectedEndpoint() throws Exception {
        String ip = nextClientIp();
        RegisterRequest registerReq = new RegisterRequest(
            "scenario1_user",
            "scenario1@example.com",
            "SecurePass123!",
            "First",
            "Last"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.username").value("scenario1_user"))
            .andExpect(jsonPath("$.data.email").value("scenario1@example.com"));

        LoginRequest loginReq = new LoginRequest("scenario1@example.com", "SecurePass123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
            .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String accessToken = json.get("data").get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("scenario1_user"))
            .andExpect(jsonPath("$.data.email").value("scenario1@example.com"));
    }

    @Test
    @DisplayName("Scenario 2: Wrong password 5x -> 6th attempt rate-limited with 429 Too Many Requests")
    void test2_wrongPasswordFiveTimes_SixthAttemptLocked429() throws Exception {
        String ip = nextClientIp();
        RegisterRequest registerReq = new RegisterRequest(
            "scenario2_user",
            "scenario2@example.com",
            "CorrectPass123!",
            "Lock",
            "Out"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        LoginRequest badLogin = new LoginRequest("scenario2@example.com", "WrongPassword999!");

        // First 4 attempts fail with 401 Unauthorized
        for (int i = 1; i <= 4; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .with(req -> { req.setRemoteAddr(ip); return req; })
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized());
        }

        // 5th failed attempt locks the account (BR-22) -> 423 Locked
        mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badLogin)))
            .andExpect(status().isLocked());

        // 6th attempt exceeds IP rate limit (BR-21 & PRD 9.4) -> 429 Too Many Requests
        mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badLogin)))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    @DisplayName("Scenario 3: Expired access token -> Refresh -> Retry -> New token accepted")
    void test3_expiredAccessTokenRefreshAndRetry() throws Exception {
        String ip = nextClientIp();
        RegisterRequest registerReq = new RegisterRequest(
            "scenario3_user",
            "scenario3@example.com",
            "SecurePass123!",
            "Token",
            "Refresh"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("scenario3@example.com", "SecurePass123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String refreshToken = loginJson.get("data").get("refreshToken").asText();
        User user = userRepository.findByEmailIgnoreCase("scenario3@example.com").orElseThrow();
        String userIdStr = user.getId().toString();

        // Create an expired access token using the application's HMAC key
        String expiredAccessToken = Jwts.builder()
            .id(UUID.randomUUID().toString())
            .subject(userIdStr)
            .claim("username", "scenario3_user")
            .claim("email", "scenario3@example.com")
            .claim("roles", List.of("USER"))
            .claim("permissions", List.of())
            .issuedAt(Date.from(Instant.now().minusSeconds(3600)))
            .expiration(Date.from(Instant.now().minusSeconds(1800)))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
            .compact();

        // Expired token rejected on protected endpoint
        mockMvc.perform(get("/api/v1/auth/me")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .header("Authorization", "Bearer " + expiredAccessToken))
            .andExpect(status().isUnauthorized());

        // Refresh tokens
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andReturn();

        JsonNode refreshJson = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        String newAccessToken = refreshJson.get("data").get("accessToken").asText();
        assertNotNull(newAccessToken);

        // Retry with new access token succeeds
        mockMvc.perform(get("/api/v1/auth/me")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .header("Authorization", "Bearer " + newAccessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("scenario3_user"));
    }

    @Test
    @DisplayName("Scenario 4: Logout -> reuse old refresh token -> 401 Unauthorized")
    void test4_logoutReuseOldRefreshTokenFails() throws Exception {
        String ip = nextClientIp();
        RegisterRequest registerReq = new RegisterRequest(
            "scenario4_user",
            "scenario4@example.com",
            "SecurePass123!",
            "Log",
            "Out"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("scenario4@example.com", "SecurePass123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn();

        String refreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
            .get("data").get("refreshToken").asText();

        // Logout revokes the refresh token
        mockMvc.perform(post("/api/v1/auth/logout")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
            .andExpect(status().isOk());

        // Reusing the revoked refresh token fails with 401
        mockMvc.perform(post("/api/v1/auth/refresh")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Scenario 5: Non-admin hits /users -> 403 Forbidden")
    void test5_nonAdminHitsUsersEndpoint_Returns403() throws Exception {
        String ip = nextClientIp();
        RegisterRequest registerReq = new RegisterRequest(
            "scenario5_user",
            "scenario5@example.com",
            "SecurePass123!",
            "Regular",
            "User"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("scenario5@example.com", "SecurePass123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn();

        String accessToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
            .get("data").get("accessToken").asText();

        // Regular user forbidden from /api/v1/users
        mockMvc.perform(get("/api/v1/users")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isForbidden());

        // Regular user forbidden from /api/v1/audit-logs
        mockMvc.perform(get("/api/v1/audit-logs")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario 6: Password reset with expired/invalid token -> 400 Bad Request")
    void test6_passwordResetWithExpiredOrInvalidToken_Returns400() throws Exception {
        String ip = nextClientIp();
        RegisterRequest registerReq = new RegisterRequest(
            "scenario6_user",
            "scenario6@example.com",
            "SecurePass123!",
            "Reset",
            "User"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        User user = userRepository.findByEmailIgnoreCase("scenario6@example.com").orElseThrow();

        // Save an explicitly expired token in database
        String rawExpiredToken = "expired-token-" + UUID.randomUUID();
        String hashedToken = refreshTokenService.hashToken(rawExpiredToken);
        PasswordResetToken expiredTokenEntity = new PasswordResetToken(user, hashedToken, Instant.now().minusSeconds(1200));
        passwordResetTokenRepository.save(expiredTokenEntity);

        // Attempt reset with expired token
        ResetPasswordRequest expiredReq = new ResetPasswordRequest(rawExpiredToken, "BrandNewSecure@Pass1");
        mockMvc.perform(post("/api/v1/auth/reset-password")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(expiredReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));

        // Attempt reset with completely non-existent token
        ResetPasswordRequest invalidReq = new ResetPasswordRequest("non-existent-token-xyz", "BrandNewSecure@Pass1");
        mockMvc.perform(post("/api/v1/auth/reset-password")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Scenario 7: Suspended user tries to login -> 403 with specific message")
    void test7_suspendedUserLoginBlockedWithMessage() throws Exception {
        String ip = nextClientIp();
        RegisterRequest registerReq = new RegisterRequest(
            "scenario7_user",
            "scenario7@example.com",
            "SecurePass123!",
            "Suspended",
            "User"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        // Mark user as suspended
        User user = userRepository.findByEmailIgnoreCase("scenario7@example.com").orElseThrow();
        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        // Attempt login
        LoginRequest loginReq = new LoginRequest("scenario7@example.com", "SecurePass123!");
        mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.status").value(403))
            .andExpect(jsonPath("$.message", containsString("Your account has been suspended")));
    }

    @Test
    @DisplayName("Scenario 8: Re-use of last password on change -> 400 Bad Request")
    void test8_reuseOfLastPasswordOnChange_Returns400() throws Exception {
        String ip = nextClientIp();
        String pass1 = "FirstSecurePass@123";
        String pass2 = "SecondSecurePass@456";

        RegisterRequest registerReq = new RegisterRequest(
            "scenario8_user",
            "scenario8@example.com",
            pass1,
            "History",
            "Check"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        // Login to get token
        LoginRequest loginReq = new LoginRequest("scenario8@example.com", pass1);
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn();

        String token1 = objectMapper.readTree(loginResult.getResponse().getContentAsString())
            .get("data").get("accessToken").asText();

        // Change password from pass1 to pass2
        ChangePasswordRequest changeReq = new ChangePasswordRequest(pass1, pass2);
        mockMvc.perform(post("/api/v1/auth/change-password")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .header("Authorization", "Bearer " + token1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changeReq)))
            .andExpect(status().isOk());

        // Login with pass2
        LoginRequest loginReq2 = new LoginRequest("scenario8@example.com", pass2);
        MvcResult loginResult2 = mockMvc.perform(post("/api/v1/auth/login")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq2)))
            .andExpect(status().isOk())
            .andReturn();

        String token2 = objectMapper.readTree(loginResult2.getResponse().getContentAsString())
            .get("data").get("accessToken").asText();

        // Attempt to change password back to pass1 (in history)
        ChangePasswordRequest reuseReq = new ChangePasswordRequest(pass2, pass1);
        mockMvc.perform(post("/api/v1/auth/change-password")
                .with(req -> { req.setRemoteAddr(ip); return req; })
                .header("Authorization", "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reuseReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message", containsString("last 5 passwords")));
    }
}
