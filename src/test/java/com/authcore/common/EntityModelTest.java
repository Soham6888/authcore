package com.authcore.common;

import com.authcore.audit.entity.AuditLog;
import com.authcore.exception.AccountLockedException;
import com.authcore.exception.AccountSuspendedException;
import com.authcore.exception.DuplicateResourceException;
import com.authcore.exception.InvalidCredentialsException;
import com.authcore.exception.InvalidPasswordException;
import com.authcore.exception.InvalidTokenException;
import com.authcore.exception.RateLimitExceededException;
import com.authcore.exception.ResourceNotFoundException;
import com.authcore.role.entity.Permission;
import com.authcore.role.entity.Role;
import com.authcore.token.entity.PasswordResetToken;
import com.authcore.token.entity.RefreshToken;
import com.authcore.user.entity.PasswordHistory;
import com.authcore.user.entity.User;
import com.authcore.user.entity.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EntityModelTest {

    @Test
    @DisplayName("User entity getters, setters, status, equals and hashcode")
    void testUserEntity() {
        User user = new User();
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();

        user.setId(id);
        user.setUsername("username");
        user.setEmail("user@example.com");
        user.setPasswordHash("hash");
        user.setFirstName("First");
        user.setLastName("Last");
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setDeletedAt(null);

        assertEquals(id, user.getId());
        assertEquals("username", user.getUsername());
        assertEquals("user@example.com", user.getEmail());
        assertEquals("hash", user.getPasswordHash());
        assertEquals("First", user.getFirstName());
        assertEquals("Last", user.getLastName());
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertTrue(user.isEmailVerified());
        assertTrue(user.isActive());
        assertFalse(user.isSuspended());
        assertFalse(user.isDeleted());

        user.setStatus(UserStatus.SUSPENDED);
        assertTrue(user.isSuspended());

        user.setDeletedAt(now);
        assertTrue(user.isDeleted());
        assertFalse(user.isActive());

        User user2 = new User("username2", "user@example.com", "hash", "First", "Last");
        assertEquals(user, user2);
        assertEquals(user.hashCode(), user2.hashCode());

        user.onCreate();
        user.onUpdate();
    }

    @Test
    @DisplayName("Role and Permission entities")
    void testRoleAndPermissionEntities() {
        Permission permission = new Permission();
        UUID permId = UUID.randomUUID();
        permission.setId(permId);
        permission.setName("users:read");
        permission.setResource("users");
        permission.setAction("read");
        permission.setCreatedAt(Instant.now());

        assertEquals(permId, permission.getId());
        assertEquals("users:read", permission.getName());
        assertEquals("users", permission.getResource());
        assertEquals("read", permission.getAction());
        assertNotNull(permission.getCreatedAt());

        Permission permission2 = new Permission("users:read", "users", "read");
        assertEquals(permission, permission2);
        assertEquals(permission.hashCode(), permission2.hashCode());

        Role role = new Role();
        UUID roleId = UUID.randomUUID();
        role.setId(roleId);
        role.setName("ADMIN");
        role.setDescription("Administrator");
        role.setSystem(true);
        role.setCreatedAt(Instant.now());
        role.setPermissions(new HashSet<>(Set.of(permission)));

        assertEquals(roleId, role.getId());
        assertEquals("ADMIN", role.getName());
        assertEquals("Administrator", role.getDescription());
        assertTrue(role.isSystem());
        assertNotNull(role.getCreatedAt());
        assertEquals(1, role.getPermissions().size());

        Role role2 = new Role("ADMIN", "Admin", true);
        assertEquals(role, role2);
        assertEquals(role.hashCode(), role2.hashCode());
    }

    @Test
    @DisplayName("RefreshToken and PasswordResetToken entities")
    void testTokenEntities() {
        User user = new User("user", "user@example.com", "hash", "F", "L");
        user.setId(UUID.randomUUID());

        RefreshToken rt = new RefreshToken();
        UUID rtId = UUID.randomUUID();
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(3600);

        rt.setId(rtId);
        rt.setUser(user);
        rt.setTokenHash("rt-hash");
        rt.setDeviceInfo("Chrome");
        rt.setIpAddress("127.0.0.1");
        rt.setExpiresAt(expiry);
        rt.setRevoked(false);
        rt.setRevokedAt(null);
        rt.setCreatedAt(now);

        assertEquals(rtId, rt.getId());
        assertEquals(user, rt.getUser());
        assertEquals("rt-hash", rt.getTokenHash());
        assertEquals("Chrome", rt.getDeviceInfo());
        assertEquals("127.0.0.1", rt.getIpAddress());
        assertEquals(expiry, rt.getExpiresAt());
        assertFalse(rt.isRevoked());
        assertTrue(rt.isValid());

        rt.revoke();
        assertTrue(rt.isRevoked());
        assertFalse(rt.isValid());

        PasswordResetToken prt = new PasswordResetToken();
        UUID prtId = UUID.randomUUID();
        prt.setId(prtId);
        prt.setUser(user);
        prt.setTokenHash("prt-hash");
        prt.setExpiresAt(expiry);
        prt.setUsed(false);
        prt.setUsedAt(null);
        prt.setCreatedAt(now);

        assertEquals(prtId, prt.getId());
        assertEquals(user, prt.getUser());
        assertEquals("prt-hash", prt.getTokenHash());
        assertTrue(prt.isValid());

        prt.setUsed(true);
        prt.setUsedAt(now);
        assertFalse(prt.isValid());
    }

    @Test
    @DisplayName("PasswordHistory and AuditLog entities")
    void testPasswordHistoryAndAuditLog() {
        User user = new User("user", "user@example.com", "hash", "F", "L");
        PasswordHistory ph = new PasswordHistory();
        UUID phId = UUID.randomUUID();
        ph.setId(phId);
        ph.setUser(user);
        ph.setPasswordHash("hash");
        ph.setCreatedAt(Instant.now());

        assertEquals(phId, ph.getId());
        assertEquals(user, ph.getUser());
        assertEquals("hash", ph.getPasswordHash());

        AuditLog al = new AuditLog();
        al.setId(100L);
        al.setUserId(user.getId());
        al.setAction("LOGIN");
        al.setIpAddress("127.0.0.1");
        al.setUserAgent("Agent");
        al.setMetadata("{}");
        al.setCreatedAt(Instant.now());
        al.setArchived(true);

        assertEquals(100L, al.getId());
        assertEquals(user.getId(), al.getUserId());
        assertEquals("LOGIN", al.getAction());
        assertEquals("127.0.0.1", al.getIpAddress());
        assertEquals("Agent", al.getUserAgent());
        assertEquals("{}", al.getMetadata());
        assertTrue(al.isArchived());
    }

    @Test
    @DisplayName("All custom ApiException subclasses")
    void testExceptions() {
        assertEquals(409, new DuplicateResourceException("msg").getStatus().value());
        assertEquals(404, new ResourceNotFoundException("msg").getStatus().value());
        assertEquals(401, new InvalidCredentialsException("msg").getStatus().value());
        assertEquals(401, new InvalidTokenException("msg").getStatus().value());
        assertEquals(403, new AccountSuspendedException("msg").getStatus().value());
        assertEquals(423, new AccountLockedException("msg").getStatus().value());
        assertEquals(429, new RateLimitExceededException("msg").getStatus().value());
        assertEquals(400, new InvalidPasswordException("msg").getStatus().value());
    }
}
