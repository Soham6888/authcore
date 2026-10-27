package com.authcore.config;

import com.authcore.role.entity.Permission;
import com.authcore.role.entity.Role;
import com.authcore.role.repository.PermissionRepository;
import com.authcore.role.repository.RoleRepository;
import com.authcore.user.entity.User;
import com.authcore.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
        RoleRepository roleRepository,
        PermissionRepository permissionRepository,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking database initialization...");

        // 1. Seed Permissions
        Map<String, Permission> permMap = new HashMap<>();
        List<Permission> standardPermissions = List.of(
            new Permission("users:read", "users", "read"),
            new Permission("users:write", "users", "write"),
            new Permission("users:delete", "users", "delete"),
            new Permission("users:status", "users", "status"),
            new Permission("roles:read", "roles", "read"),
            new Permission("roles:write", "roles", "write"),
            new Permission("roles:delete", "roles", "delete"),
            new Permission("sessions:read", "sessions", "read"),
            new Permission("sessions:delete", "sessions", "delete"),
            new Permission("audit:read", "audit", "read")
        );

        for (Permission perm : standardPermissions) {
            Permission existing = permissionRepository.findByName(perm.getName())
                .orElseGet(() -> permissionRepository.save(perm));
            permMap.put(existing.getName(), existing);
        }

        // 2. Seed Roles
        Role superAdminRole = roleRepository.findByName("SUPER_ADMIN")
            .orElseGet(() -> {
                Role r = new Role("SUPER_ADMIN", "Platform super administrator with unrestricted privileges", true);
                r.setPermissions(new HashSet<>(permMap.values()));
                return roleRepository.save(r);
            });

        Role adminRole = roleRepository.findByName("ADMIN")
            .orElseGet(() -> {
                Role r = new Role("ADMIN", "Administrative user with user and system management access", true);
                Set<Permission> adminPerms = new HashSet<>();
                for (String p : List.of("users:read", "users:write", "users:status", "roles:read", "sessions:read", "sessions:delete", "audit:read")) {
                    if (permMap.containsKey(p)) adminPerms.add(permMap.get(p));
                }
                r.setPermissions(adminPerms);
                return roleRepository.save(r);
            });

        Role modRole = roleRepository.findByName("MODERATOR")
            .orElseGet(() -> {
                Role r = new Role("MODERATOR", "Moderator with user inspection and status moderation capabilities", true);
                Set<Permission> modPerms = new HashSet<>();
                for (String p : List.of("users:read", "users:status", "audit:read")) {
                    if (permMap.containsKey(p)) modPerms.add(permMap.get(p));
                }
                r.setPermissions(modPerms);
                return roleRepository.save(r);
            });

        Role userRole = roleRepository.findByName("USER")
            .orElseGet(() -> roleRepository.save(new Role("USER", "Standard registered application user", true)));

        // 3. Seed Default Admin User if no users exist
        if (userRepository.count() == 0) {
            log.info("No users found. Creating default administrator accounts for local development...");
            
            User superAdmin = new User(
                "superadmin",
                "superadmin@authcore.io",
                passwordEncoder.encode("AdminPassword123!"),
                "Super",
                "Admin"
            );
            superAdmin.setEmailVerified(true);
            superAdmin.setRoles(Set.of(superAdminRole, adminRole, userRole));
            userRepository.save(superAdmin);

            User testUser = new User(
                "johndoe",
                "john.doe@example.com",
                passwordEncoder.encode("Password123!"),
                "John",
                "Doe"
            );
            testUser.setEmailVerified(true);
            testUser.setRoles(Set.of(userRole));
            userRepository.save(testUser);

            log.info("Seeded default users:");
            log.info("  SuperAdmin: superadmin@authcore.io / AdminPassword123!");
            log.info("  User:       john.doe@example.com / Password123!");
        }

        log.info("Database initialization completed successfully.");
    }
}
