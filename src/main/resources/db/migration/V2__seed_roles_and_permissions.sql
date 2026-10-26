-- =============================================================================
-- Migration: V2__seed_roles_and_permissions.sql
-- Description: Seed built-in system roles, permissions, and initial associations
-- =============================================================================

-- Seed System Roles
INSERT INTO roles (id, name, description, is_system) VALUES
    ('11111111-1111-1111-1111-111111111111', 'SUPER_ADMIN', 'Platform super administrator with unrestricted privileges', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'ADMIN', 'Administrative user with user and system management access', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'MODERATOR', 'Moderator with user inspection and status moderation capabilities', TRUE),
    ('44444444-4444-4444-4444-444444444444', 'USER', 'Standard registered application user', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Seed Permissions
INSERT INTO permissions (id, name, resource, action) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'users:read', 'users', 'read'),
    ('a2222222-2222-2222-2222-222222222222', 'users:write', 'users', 'write'),
    ('a3333333-3333-3333-3333-333333333333', 'users:delete', 'users', 'delete'),
    ('a4444444-4444-4444-4444-444444444444', 'users:status', 'users', 'status'),
    ('b1111111-1111-1111-1111-111111111111', 'roles:read', 'roles', 'read'),
    ('b2222222-2222-2222-2222-222222222222', 'roles:write', 'roles', 'write'),
    ('b3333333-3333-3333-3333-333333333333', 'roles:delete', 'roles', 'delete'),
    ('c1111111-1111-1111-1111-111111111111', 'sessions:read', 'sessions', 'read'),
    ('c2222222-2222-2222-2222-222222222222', 'sessions:delete', 'sessions', 'delete'),
    ('d1111111-1111-1111-1111-111111111111', 'audit:read', 'audit', 'read')
ON CONFLICT (resource, action) DO NOTHING;

-- Associate Permissions to SUPER_ADMIN (All permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', p.id
FROM permissions p
ON CONFLICT DO NOTHING;

-- Associate Permissions to ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', p.id
FROM permissions p
WHERE p.name IN (
    'users:read', 'users:write', 'users:status',
    'roles:read',
    'sessions:read', 'sessions:delete',
    'audit:read'
)
ON CONFLICT DO NOTHING;

-- Associate Permissions to MODERATOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', p.id
FROM permissions p
WHERE p.name IN (
    'users:read', 'users:status', 'audit:read'
)
ON CONFLICT DO NOTHING;

-- Associate Permissions to USER
INSERT INTO role_permissions (role_id, permission_id)
SELECT '44444444-4444-4444-4444-444444444444', p.id
FROM permissions p
WHERE p.name IN (
    'users:read', 'sessions:read', 'sessions:delete'
)
ON CONFLICT DO NOTHING;
