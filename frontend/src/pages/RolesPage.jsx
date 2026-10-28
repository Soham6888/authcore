import React, { useState, useEffect } from 'react';
import { rolesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  KeyRound, 
  Plus, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const ALL_PERMISSIONS = [
  { name: 'users:read', category: 'User Management', desc: 'Read and list users' },
  { name: 'users:write', category: 'User Management', desc: 'Create and update users' },
  { name: 'users:delete', category: 'User Management', desc: 'Soft-delete users' },
  { name: 'users:status', category: 'User Management', desc: 'Change user status (active/suspended)' },
  { name: 'roles:read', category: 'Role Management', desc: 'List and view roles' },
  { name: 'roles:write', category: 'Role Management', desc: 'Create and edit roles' },
  { name: 'roles:delete', category: 'Role Management', desc: 'Delete custom roles' },
  { name: 'sessions:read', category: 'Session Management', desc: 'Inspect user active sessions' },
  { name: 'sessions:delete', category: 'Session Management', desc: 'Revoke active refresh sessions' },
  { name: 'audit:read', category: 'Audit Logs', desc: 'Read security audit trail' }
];

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
      alert('Built-in system roles cannot be deleted (BR-17).');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete role '${role.name}'?`)) return;

    try {
      await rolesApi.deleteRole(role.id);
      loadRoles();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>Role-Based Access Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Configure RBAC policies, assign permissions, and supervise authority boundaries.
          </p>
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
            <Plus size={16} />
            Create Custom Role
          </button>
        )}
      </div>

      {/* Roles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading roles...
          </div>
        ) : roles.map(role => (
          <div key={role.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: role.isSystem ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: role.isSystem ? '#fbbf24' : '#60a5fa'
                  }}>
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{role.name}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                      {role.isSystem ? '🛡️ Built-in System Role (BR-17)' : '✨ Custom Defined Role'}
                    </div>
                  </div>
                </div>

                <span className={`badge ${role.isSystem ? 'badge-gold' : 'badge-blue'}`}>
                  {role.isSystem ? 'SYSTEM' : 'CUSTOM'}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', minHeight: '38px' }}>
                {role.description || 'No description provided.'}
              </p>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', letterSpacing: '0.8px', marginBottom: '8px' }}>
                  Assigned Permissions ({role.permissions?.length || 0})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {role.permissions?.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                      No permissions attached (Standard user access only)
                    </span>
                  ) : (
                    role.permissions?.map(p => (
                      <span key={p} className="badge badge-neutral" style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                        {p}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Actions for custom roles or edit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              {isSuperAdmin() && (
                <>
                  <button onClick={() => openEditModal(role)} className="btn btn-secondary btn-sm">
                    <Edit3 size={13} />
                    Edit Permissions
                  </button>
                  {!role.isSystem && (
                    <button onClick={() => handleDeleteRole(role)} className="btn btn-danger btn-sm">
                      <Trash2 size={13} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ROLE MODAL */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>Create Custom RBAC Role</h3>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '24px' }}>
              {formError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Role Name (Uppercase & Underscores)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BILLING_AUDITOR"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Role Description
                </label>
                <input
                  type="text"
                  placeholder="Explain the scope and responsibilities of this role..."
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Select Permissions ({selectedPerms.length} selected):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {ALL_PERMISSIONS.map(p => {
                    const isChecked = selectedPerms.includes(p.name);
                    return (
                      <div
                        key={p.name}
                        onClick={() => togglePerm(p.name)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isChecked ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                          background: isChecked ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface-elevated)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isChecked ? 'none' : '1px solid var(--text-faint)',
                          background: isChecked ? '#f59e0b' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isChecked && <Check size={13} color="#000" strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: isChecked ? '#fbbf24' : '#fff', fontFamily: 'monospace' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{p.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary">
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

      {/* EDIT ROLE MODAL */}
      {editModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>Edit Role: {selectedRole.name}</h3>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '24px' }}>
              {formError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Role Description
                </label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Manage Permissions ({selectedPerms.length} active):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {ALL_PERMISSIONS.map(p => {
                    const isChecked = selectedPerms.includes(p.name);
                    return (
                      <div
                        key={p.name}
                        onClick={() => togglePerm(p.name)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isChecked ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                          background: isChecked ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface-elevated)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isChecked ? 'none' : '1px solid var(--text-faint)',
                          background: isChecked ? '#f59e0b' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isChecked && <Check size={13} color="#000" strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: isChecked ? '#fbbf24' : '#fff', fontFamily: 'monospace' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{p.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-secondary">
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
