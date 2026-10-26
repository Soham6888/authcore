package com.authcore.user;

import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.auth.dto.AuthResponse;
import com.authcore.auth.dto.ChangePasswordRequest;
import com.authcore.auth.dto.ForgotPasswordRequest;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.auth.dto.ResetPasswordRequest;
import com.authcore.ratelimit.RateLimitService;
import com.authcore.role.entity.Role;
import com.authcore.role.repository.RoleRepository;
import com.authcore.token.repository.PasswordResetTokenRepository;
import com.authcore.token.repository.RefreshTokenRepository;
import com.authcore.user.dto.UpdateProfileRequest;
import com.authcore.user.entity.User;
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

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class UserIntegrationTest {

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
    private AuditLogRepository auditLogRepository;
    @Autowired
    private RateLimitService rateLimitService;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final AtomicInteger ipCounter = new AtomicInteger(10);
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

    private String registerAndLogin(String username, String email, String password, String roleName) throws Exception {
        String clientIp = "10.0.0." + ipCounter.incrementAndGet();
        RegisterRequest registerReq = new RegisterRequest(username, email, password, "First", "Last");
        mockMvc.perform(post("/api/v1/auth/register")
                .with(request -> { request.setRemoteAddr(clientIp); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated());

        if (roleName != null && !roleName.equalsIgnoreCase("USER")) {
            User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
            Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName, "Role " + roleName, true)));
            user.setRoles(Set.of(role));
            userRepository.save(user);
        }

        LoginRequest loginReq = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .with(request -> { request.setRemoteAddr(clientIp); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("data").get("accessToken").asText();
    }

    @Test
    @DisplayName("Admin can list users; regular user receives 403 Forbidden")
    void listUsers_RbacEnforced() throws Exception {
        String adminToken = registerAndLogin("admin_user", "admin@example.com", "AdminPass@123", "ADMIN");
        String userToken = registerAndLogin("regular_user", "user@example.com", "UserPass@123", "USER");

        // Admin access succeeds
        mockMvc.perform(get("/api/v1/users")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content").isArray());

        // Regular user access forbidden
        mockMvc.perform(get("/api/v1/users")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User can update own profile via PATCH /api/v1/users/{id}")
    void updateProfile_Self_Success() throws Exception {
        String userToken = registerAndLogin("profile_user", "profile@example.com", "SecureP@ss123", "USER");
        User user = userRepository.findByEmailIgnoreCase("profile@example.com").orElseThrow();

        UpdateProfileRequest updateReq = new UpdateProfileRequest("UpdatedFirst", "UpdatedLast");

        mockMvc.perform(patch("/api/v1/users/" + user.getId())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.firstName").value("UpdatedFirst"))
            .andExpect(jsonPath("$.data.lastName").value("UpdatedLast"));
    }

    @Test
    @DisplayName("Password reset lifecycle: Forgot password -> Reset password -> Login with new password")
    void passwordResetLifecycle_Success() throws Exception {
        registerAndLogin("reset_user", "reset@example.com", "OriginalPass@123", "USER");

        // 1. Forgot password
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest("reset@example.com");
        MvcResult forgotResult = mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotReq)))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode forgotJson = objectMapper.readTree(forgotResult.getResponse().getContentAsString());
        String resetToken = forgotJson.get("data").get("resetToken").asText();

        // 2. Reset password
        ResetPasswordRequest resetReq = new ResetPasswordRequest(resetToken, "BrandNewP@ssword123");
        mockMvc.perform(post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetReq)))
            .andExpect(status().isOk());

        // 3. Login with old password fails
        LoginRequest oldLogin = new LoginRequest("reset@example.com", "OriginalPass@123");
        mockMvc.perform(post("/api/v1/auth/login")
                .with(request -> { request.setRemoteAddr("10.0.0." + ipCounter.incrementAndGet()); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(oldLogin)))
            .andExpect(status().isUnauthorized());

        // 4. Login with new password succeeds
        LoginRequest newLogin = new LoginRequest("reset@example.com", "BrandNewP@ssword123");
        mockMvc.perform(post("/api/v1/auth/login")
                .with(request -> { request.setRemoteAddr("10.0.0." + ipCounter.incrementAndGet()); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLogin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("Change password authenticated lifecycle: /change-password succeeds with valid current password")
    void changePassword_Success() throws Exception {
        String token = registerAndLogin("change_user", "change@example.com", "InitialPass@123", "USER");

        ChangePasswordRequest changeReq = new ChangePasswordRequest("InitialPass@123", "NewChangedPass@123");

        mockMvc.perform(post("/api/v1/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changeReq)))
            .andExpect(status().isOk());

        // Verify login works with new password
        LoginRequest newLogin = new LoginRequest("change@example.com", "NewChangedPass@123");
        mockMvc.perform(post("/api/v1/auth/login")
                .with(request -> { request.setRemoteAddr("10.0.0." + ipCounter.incrementAndGet()); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLogin)))
            .andExpect(status().isOk());
    }
}
