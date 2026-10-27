package com.authcore.auth;

import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RefreshTokenRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.ratelimit.RateLimitService;
import com.authcore.token.repository.PasswordResetTokenRepository;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.user.repository.PasswordHistoryRepository;
import com.authcore.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AuthIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private RateLimitService rateLimitService;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
            .apply(springSecurity())
            .build();
        rateLimitService.clearAllLimits();
        passwordResetTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        passwordHistoryRepository.deleteAll();
        auditLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("End-to-end auth lifecycle: Register -> Login -> Me -> Refresh -> Logout")
    void fullAuthLifecycle_Success() throws Exception {
        // 1. Register
        RegisterRequest registerReq = new RegisterRequest(
            "patil_soham",
            "patil.soham@example.com",
            "P@ssword123!",
            "Soham",
            "Patil"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value(201))
            .andExpect(jsonPath("$.data.username").value("patil_soham"))
            .andExpect(jsonPath("$.data.email").value("patil.soham@example.com"));

        // 2. Login
        LoginRequest loginReq = new LoginRequest("patil.soham@example.com", "P@ssword123!");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
            .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String accessToken = loginJson.get("data").get("accessToken").asText();
        String refreshToken = loginJson.get("data").get("refreshToken").asText();

        assertNotNull(accessToken);
        assertNotNull(refreshToken);

        // 3. Access Protected /me endpoint with Bearer Token
        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("patil_soham"));

        // 4. Rotate Refresh Token
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
            .andReturn();

        JsonNode refreshJson = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        String newRefreshToken = refreshJson.get("data").get("refreshToken").asText();

        // 5. Logout
        RefreshTokenRequest logoutReq = new RefreshTokenRequest(newRefreshToken);
        mockMvc.perform(post("/api/v1/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(logoutReq)))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Login with invalid password returns 401 Unauthorized")
    void loginWithWrongPassword_Returns401() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
            "test_user",
            "test@example.com",
            "P@ssword123!",
            "Test",
            "User"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        LoginRequest wrongLogin = new LoginRequest("test@example.com", "WrongPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrongLogin)))
            .andExpect(status().isUnauthorized());
    }
}
