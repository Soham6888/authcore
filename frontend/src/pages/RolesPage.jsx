import React, { useState, useEffect } from 'react';
import { rolesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/ClassicalIcons';
import { 
  KeyRound, 
  Plus, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Crown,
  Shield
} from 'lucide-react';

const PERMISSION_CATEGORIES = [
  {
    category: 'Role & Policy Management',
    permissions: [
      { name: 'roles:read', desc: 'List and view defined roles and permissions' },
      { name: 'roles:write', desc: 'Create new custom roles and update authorities' },
      { name: 'roles:delete', desc: 'Delete custom non-system roles' },
    ]
  },
  {
    category: 'User Management',
    permissions: [
      { name: 'users:read', desc: 'Inspect user accounts and profile data' },
      { name: 'users:write', desc: 'Create or update user account details' },
      { name: 'users:status', desc: 'Change account status (Active / Suspended)' },
      { name: 'users:delete', desc: 'Initiate 30-day soft deletion lifecycle' },
    ]
  },
  {
    category: 'Session & Token Management',
    permissions: [
      { name: 'sessions:read', desc: 'View active device sessions across the system' },
      { name: 'sessions:delete', desc: 'Revoke active refresh sessions and tokens' },
    ]
  },
  {
    category: 'Audit Logs',
    permissions: [
      { name: 'audit:read', desc: 'Read immutable security event logs' },
    ]
  }
];

const HIERARCHY_ORDER = {
  SUPER_ADMIN: { rank: 1, title: 'Super Admin', desc: 'Full sovereign control over all system policies, roles, and accounts.' },
  ADMIN:       { rank: 2, title: 'Admin',       desc: 'Executive management of user accounts, sessions, and permissions.' },
  MODERATOR:   { rank: 3, title: 'Moderator',   desc: 'User inspection, account status moderation, and audit review.' },
  USER:        { rank: 4, title: 'User',        desc: 'Standard authenticated account with self-service identity management.' }
};

export function RolesPage() {
  const { isSuperAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [formError, setFormError] = useState(null);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await rolesApi.getRoles();
      if (res.data) setRoles(res.data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const togglePerm = (permName) => {
    setSelectedPerms(prev => 
      prev.includes(permName) ? prev.filter(p => p !== permName) : [...prev, permName]
    );
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await rolesApi.createRole({
        name: newRoleName.trim().toUpperCase(),
        description: newRoleDesc.trim(),
        permissions: selectedPerms
      });
      loadRoles();
      setCreateModal(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedPerms([]);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setNewRoleDesc(role.description || '');
    setSelectedPerms(role.permissions || []);
    setFormError(null);
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await rolesApi.updateRole(selectedRole.id, {
        description: newRoleDesc.trim(),
        permissions: selectedPerms
      });
      loadRoles();
      setEditModal(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      alert('Built-in system roles cannot be deleted (Rule BR-17).');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role '${role.name}'?`)) return;

    try {
      await rolesApi.deleteRole(role.id);
      loadRoles();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const sortedRoles = [...roles].sort((a, b) => {
    const rankA = HIERARCHY_ORDER[a.name]?.rank || 99;
    const rankB = HIERARCHY_ORDER[b.name]?.rank || 99;
    return rankA - rankB;
  });

  return (
    <div className="fade-in">
      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">ROLES &amp; PERMISSIONS</h1>
          <p className="page-subtitle">
            Configure Role-Based Access Control (RBAC), inspect permissions, and supervise authority tiers.
          </p>
          <div className="page-title-line" />
        </div>

        {isSuperAdmin() && (
          <button 
            onClick={() => {
              setNewRoleName('');
              setNewRoleDesc('');
              setSelectedPerms([]);
              setFormError(null);
              setCreateModal(true);
            }} 
            className="btn btn-primary"
          >
            <Plus size={15} />
            <span>Create Custom Role</span>
          </button>
        )}
      </div>

      {/* ─── HIERARCHY TIER CARDS ─── */}
      <div className="card" style={{ marginBottom: '28px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Crown size={16} color="var(--gold-primary)" />
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase' }}>
            Authority Hierarchy
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}>
          {['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'].map((rName, idx) => {
            const h = HIERARCHY_ORDER[rName];
            return (
              <div
                key={rName}
                style={{
                  background: 'var(--bg-elevated)',
                  border: 'var(--border-subtle)',
                  borderTop: `2px solid ${idx === 0 ? 'var(--gold-bright)' : idx === 1 ? '#60a5fa' : idx === 2 ? '#c084fc' : 'var(--status-active)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Level {idx + 1}</span>
                  <RoleBadge role={rName} />
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {h.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  {h.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── ROLES LIST GRID ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ display: 'block', margin: '0 auto 12px' }} />
            <span>Loading roles...</span>
          </div>
        ) : sortedRoles.map(role => {
          const isSystem = role.isSystem;

          return (
            <div
              key={role.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: isSystem ? '2px solid var(--gold-primary)' : '2px solid rgba(255,255,255,0.1)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isSystem ? 'var(--gold-faint)' : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${isSystem ? 'var(--border-gold)' : 'rgba(59,130,246,0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSystem ? 'var(--gold-bright)' : '#60a5fa'
                    }}>
                      <KeyRound size={17} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {role.name}
                      </h3>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '1px' }}>
                        {isSystem ? 'Built-in System Role (Rule BR-17)' : 'Custom Role'}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${isSystem ? 'badge-gold' : 'badge-info'}`}>
                    {isSystem ? 'SYSTEM' : 'CUSTOM'}
                  </span>
                </div>

                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                  minHeight: '36px',
                  lineHeight: 1.4
                }}>
                  {role.description || 'No description provided.'}
                </p>

                {/* Granted Permissions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Granted Permissions:</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                      {role.permissions?.length || 0} permissions
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {role.permissions?.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                        Standard user access only
                      </span>
                    ) : (
                      role.permissions?.map(p => (
                        <span key={p} className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                          {p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: 'var(--border-subtle)'
              }}>
                {isSuperAdmin() && (
                  <>
                    <button onClick={() => openEditModal(role)} className="btn btn-secondary btn-sm">
                      <Edit3 size={12} />
                      <span>Edit Permissions</span>
                    </button>
                    {!isSystem && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="btn btn-danger btn-sm"
                        title="Delete Role"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MODAL: CREATE ROLE ─── */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">Create Custom Role</h3>
              <button onClick={() => setCreateModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-body">
              {formError && (
                <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', color: 'var(--status-danger)', fontSize: '0.8rem', marginBottom: '14px' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Role Name (Uppercase &amp; Underscores)</label>
                  <input
                    type="text"
                    className="input-field input-mono"
                    placeholder="e.g. AUDIT_INSPECTOR"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Role Description</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Explain the scope and responsibilities of this role..."
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                    Select Permissions ({selectedPerms.length} selected):
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {PERMISSION_CATEGORIES.map(cat => (
                      <div key={cat.category}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold-aged)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          {cat.category}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {cat.permissions.map(p => {
                            const isChecked = selectedPerms.includes(p.name);
                            return (
                              <div
                                key={p.name}
                                onClick={() => togglePerm(p.name)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: isChecked ? '1px solid var(--gold-primary)' : 'var(--border-subtle)',
                                  background: isChecked ? 'var(--gold-faint)' : 'var(--bg-elevated)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                <div style={{
                                  width: '15px', height: '15px', borderRadius: '3px',
                                  border: isChecked ? 'none' : '1px solid var(--text-faint)',
                                  background: isChecked ? 'var(--gold-primary)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isChecked && <Check size={11} color="#08080b" strokeWidth={3} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isChecked ? 'var(--gold-bright)' : 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                                    {p.name}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.desc}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '16px', padding: 0 }}>
                <button type="button" onClick={() => setCreateModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT ROLE PERMISSIONS ─── */}
      {editModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">Edit Role: {selectedRole.name}</h3>
              <button onClick={() => setEditModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              {formError && (
                <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', color: 'var(--status-danger)', fontSize: '0.8rem', marginBottom: '14px' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Role Description</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                    Manage Permissions ({selectedPerms.length} selected):
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {PERMISSION_CATEGORIES.map(cat => (
                      <div key={cat.category}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold-aged)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          {cat.category}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {cat.permissions.map(p => {
                            const isChecked = selectedPerms.includes(p.name);
                            return (
                              <div
                                key={p.name}
                                onClick={() => togglePerm(p.name)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: isChecked ? '1px solid var(--gold-primary)' : 'var(--border-subtle)',
                                  background: isChecked ? 'var(--gold-faint)' : 'var(--bg-elevated)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                <div style={{
                                  width: '15px', height: '15px', borderRadius: '3px',
                                  border: isChecked ? 'none' : '1px solid var(--text-faint)',
                                  background: isChecked ? 'var(--gold-primary)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isChecked && <Check size={11} color="#08080b" strokeWidth={3} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isChecked ? 'var(--gold-bright)' : 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                                    {p.name}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.desc}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '16px', padding: 0 }}>
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
