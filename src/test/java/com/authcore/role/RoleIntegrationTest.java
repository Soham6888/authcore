package com.authcore.role;

import com.authcore.audit.repository.AuditLogRepository;
import com.authcore.auth.dto.LoginRequest;
import com.authcore.auth.dto.RegisterRequest;
import com.authcore.ratelimit.RateLimitService;
import com.authcore.role.dto.AssignRoleRequest;
import com.authcore.role.dto.CreateRoleRequest;
import com.authcore.role.dto.UpdateRoleRequest;
import com.authcore.role.entity.Role;
import com.authcore.role.repository.RoleRepository;
import com.authcore.token.repository.RefreshTokenRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class RoleIntegrationTest {

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;
    @Autowired
    private com.authcore.token.repository.PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;
    @Autowired
    private RateLimitService rateLimitService;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final AtomicInteger ipCounter = new AtomicInteger(50);
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
        String clientIp = "10.0.1." + ipCounter.incrementAndGet();
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
    @DisplayName("Role lifecycle: list roles -> create custom role -> update role -> delete role")
    void roleLifecycle_Success() throws Exception {
        String superAdminToken = registerAndLogin("super_admin", "superadmin@example.com", "SuperAdminPass@123", "SUPER_ADMIN");

        // 1. List roles
        mockMvc.perform(get("/api/v1/roles")
                .header("Authorization", "Bearer " + superAdminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());

        // 2. Create custom role
        CreateRoleRequest createReq = new CreateRoleRequest("CONTENT_EDITOR", "Editor of content", Set.of("users:read"));
        MvcResult createResult = mockMvc.perform(post("/api/v1/roles")
                .header("Authorization", "Bearer " + superAdminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.name").value("CONTENT_EDITOR"))
            .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String roleId = createdJson.get("data").get("id").asText();

        // 3. Update custom role
        UpdateRoleRequest updateReq = new UpdateRoleRequest("Updated Editor description", Set.of("users:read", "users:write"));
        mockMvc.perform(patch("/api/v1/roles/" + roleId)
                .header("Authorization", "Bearer " + superAdminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.description").value("Updated Editor description"));

        // 4. Delete custom role
        mockMvc.perform(delete("/api/v1/roles/" + roleId)
                .header("Authorization", "Bearer " + superAdminToken))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("User role assignment & removal lifecycle")
    void userRoleAssignment_Lifecycle() throws Exception {
        roleRepository.findByName("ADMIN")
            .orElseGet(() -> roleRepository.save(new Role("ADMIN", "Admin role", true)));

        String superAdminToken = registerAndLogin("sa_user", "sa@example.com", "SuperPass@123", "SUPER_ADMIN");
        registerAndLogin("target_user", "target@example.com", "TargetPass@123", "USER");

        User targetUser = userRepository.findByEmailIgnoreCase("target@example.com").orElseThrow();

        // 1. Super admin assigns ADMIN role to target user
        AssignRoleRequest assignReq = new AssignRoleRequest("ADMIN");
        mockMvc.perform(post("/api/v1/users/" + targetUser.getId() + "/roles")
                .header("Authorization", "Bearer " + superAdminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(assignReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.roles").isArray());

        Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();

        // 2. Super admin removes ADMIN role
        mockMvc.perform(delete("/api/v1/users/" + targetUser.getId() + "/roles/" + adminRole.getId())
                .header("Authorization", "Bearer " + superAdminToken))
            .andExpect(status().isOk());
    }
}
