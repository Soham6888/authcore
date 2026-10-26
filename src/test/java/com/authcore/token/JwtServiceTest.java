package com.authcore.token;

import com.authcore.role.entity.Permission;
import com.authcore.role.entity.Role;
import com.authcore.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 900);

        testUser = new User("soham_dev", "soham@example.com", "hash", "Soham", "Patil");
        testUser.setId(UUID.randomUUID());

        Role userRole = new Role("USER", "Standard User", true);
        Permission readPerm = new Permission("users:read", "users", "read");
        userRole.setPermissions(Collections.singleton(readPerm));
        testUser.setRoles(Set.of(userRole));
    }

    @Test
    @DisplayName("Generate access token and extract valid claims")
    void generateAccessToken_Success() {
        String token = jwtService.generateAccessToken(testUser);

        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token));
        assertEquals(testUser.getId(), jwtService.extractUserId(token));
        assertEquals("soham_dev", jwtService.extractUsername(token));

        List<String> roles = jwtService.extractRoles(token);
        assertEquals(1, roles.size());
        assertEquals("USER", roles.get(0));

        List<String> perms = jwtService.extractPermissions(token);
        assertEquals(1, perms.size());
        assertEquals("users:read", perms.get(0));
    }

    @Test
    @DisplayName("Invalid or tampered token returns false")
    void isTokenValid_TamperedToken_ReturnsFalse() {
        String token = jwtService.generateAccessToken(testUser);
        String tamperedToken = token + "xyz";

        assertFalse(jwtService.isTokenValid(tamperedToken));
        assertFalse(jwtService.isTokenValid("not.a.valid.jwt"));
    }
}
