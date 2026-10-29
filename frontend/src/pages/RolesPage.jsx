import React, { useState, useEffect } from 'react';
import { rolesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  AegisShieldIcon, 
  LaurelWreathIcon, 
  GreekColumnIcon, 
  WaxSealIcon, 
  RoleBadge, 
  LaurelDivider 
} from '../components/ClassicalIcons';
import { 
  KeyRound, 
  Plus, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Crown,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

/* ─── CLASSICAL PERMISSION TAXONOMY ─── */
const PERMISSION_CATEGORIES = [
  {
    category: 'Senatus Consultum (Role & Policy)',
    permissions: [
      { name: 'roles:read', desc: 'Inspect defined dignities and privilege sets' },
      { name: 'roles:write', desc: 'Inscribe new titles or alter authorities' },
      { name: 'roles:delete', desc: 'Dissolve custom non-system roles' },
    ]
  },
  {
    category: 'Potestas Civium (Citizen Management)',
    permissions: [
      { name: 'users:read', desc: 'Inspect citizen census and profiles' },
      { name: 'users:write', desc: 'Inscribe or update citizen credentials' },
      { name: 'users:status', desc: 'Alter citizen status (Stabilis / Interdictus)' },
      { name: 'users:delete', desc: 'Initiate 30-day soft deletion protocol' },
    ]
  },
  {
    category: 'Tessera Sessionis (Token & Session)',
    permissions: [
      { name: 'sessions:read', desc: 'Inspect active device tokens across the realm' },
      { name: 'sessions:delete', desc: 'Revoke remote sessions and banish tokens' },
    ]
  },
  {
    category: 'Codex Annales (Audit Chronicle)',
    permissions: [
      { name: 'audit:read', desc: 'Examine immutable security event scrolls' },
    ]
  }
];

const ALL_PERMISSIONS = PERMISSION_CATEGORIES.flatMap(c => c.permissions);

const HIERARCHY_ORDER = {
  SUPER_ADMIN: { rank: 1, latin: 'Imperator', desc: 'Supreme Sovereign authority over all decrees, keys, and citizens.' },
  ADMIN:       { rank: 2, latin: 'Magistratus', desc: 'Executive governance of citizen rosters, sessions, and roles.' },
  MODERATOR:   { rank: 3, latin: 'Tribunus', desc: 'Judicial supervision, status moderation, and audit review.' },
  USER:        { rank: 4, latin: 'Civis', desc: 'Standard citizen with self-service identity and session privileges.' }
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
      console.error('Failed to load cursus honorum:', err);
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
      alert('Decree BR-17: Built-in system dignities are perpetual and cannot be dissolved.');
      return;
    }
    if (!window.confirm(`Dissolve and purge title '${role.name}' from the imperial codex?`)) return;

    try {
      await rolesApi.deleteRole(role.id);
      loadRoles();
    } catch (err) {
      alert('Dissolution failed: ' + err.message);
    }
  };

  // Sort roles into hierarchy (SUPER_ADMIN first, then ADMIN, MODERATOR, USER, then custom roles)
  const sortedRoles = [...roles].sort((a, b) => {
    const rankA = HIERARCHY_ORDER[a.name]?.rank || 99;
    const rankB = HIERARCHY_ORDER[b.name]?.rank || 99;
    return rankA - rankB;
  });

  return (
    <div className="fade-in">
      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <GreekColumnIcon size={22} color="var(--gold-primary)" />
            <h1 className="page-title">CURSUS HONORUM</h1>
          </div>
          <p className="page-subtitle">
            The aristocratic ladder of imperial offices, sovereign privileges, and granular authorizations.
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
            <span>Inscribe New Dignity</span>
          </button>
        )}
      </div>

      {/* ─── HIERARCHY PEDIGREE OVERVIEW CARD ─── */}
      <div className="card" style={{ marginBottom: '32px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Crown size={18} color="var(--gold-primary)" />
          <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Lineage of Sovereign Authority
          </h2>
        </div>

        {/* Cursus Honorum Tree Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          position: 'relative'
        }}>
          {['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'].map((rName, idx) => {
            const h = HIERARCHY_ORDER[rName];
            return (
              <div
                key={rName}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderTop: `3px solid ${idx === 0 ? 'var(--gold-bright)' : idx === 1 ? '#60a5fa' : idx === 2 ? '#c084fc' : 'var(--status-active)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="roman-label">Tier {['I', 'II', 'III', 'IV'][idx]}</span>
                  <RoleBadge role={rName} />
                </div>
                <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {h.latin}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  {h.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── ROLES LIST GRID ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <span className="spinner-lg spinner" style={{ display: 'block', margin: '0 auto 16px' }} />
            <span style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '1.1rem' }}>
              Consulting the Senatus Rolls...
            </span>
          </div>
        ) : sortedRoles.map(role => {
          const isSystem = role.isSystem;
          const hierarchyInfo = HIERARCHY_ORDER[role.name];

          return (
            <div
              key={role.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: isSystem ? '3px solid var(--gold-primary)' : '3px solid var(--gold-hairline)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: isSystem ? 'rgba(212,175,55,0.15)' : 'rgba(59,130,246,0.15)',
                      border: `1px solid ${isSystem ? 'rgba(212,175,55,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSystem ? 'var(--gold-bright)' : '#60a5fa'
                    }}>
                      <WaxSealIcon size={20} color={isSystem ? 'var(--gold-bright)' : '#60a5fa'} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                          {role.name}
                        </h3>
                        {hierarchyInfo && (
                          <span style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--gold-aged)' }}>
                            ({hierarchyInfo.latin})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {isSystem ? 'Perpetual System Dignity (BR-17)' : 'Extraordinary Custom Inscription'}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${isSystem ? 'badge-imperator' : 'badge-info'}`}>
                    {isSystem ? 'SYSTEM' : 'CUSTOM'}
                  </span>
                </div>

                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  color: 'var(--text-body)',
                  marginBottom: '16px',
                  minHeight: '40px',
                  lineHeight: 1.5
                }}>
                  {role.description || 'No formal decree inscribed.'}
                </p>

                {/* Granted Permissions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="roman-label">Privilegia Inscripta:</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                      {role.permissions?.length || 0} permissions
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {role.permissions?.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                        Civic base access only (no elevated authorities)
                      </span>
                    ) : (
                      role.permissions?.map(p => (
                        <span key={p} className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
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
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(212,175,55,0.1)'
              }}>
                {isSuperAdmin() && (
                  <>
                    <button onClick={() => openEditModal(role)} className="btn btn-secondary btn-sm">
                      <Edit3 size={13} />
                      <span>Aliter Privilegia</span>
                    </button>
                    {!isSystem && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="btn btn-danger btn-sm"
                        title="Dissolve Custom Dignity"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MODAL: INSCRIBE NEW DIGNITY (CREATE ROLE) ─── */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WaxSealIcon size={20} color="var(--gold-primary)" />
                <h3 className="modal-title">Inscribere Novum Titulum (Create Role)</h3>
              </div>
              <button onClick={() => setCreateModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-body">
              {formError && (
                <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '6px', color: 'var(--status-danger)', fontSize: '0.8rem', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Nomen Tituli (Uppercase &amp; Underscores)</label>
                  <input
                    type="text"
                    className="input-field input-mono"
                    placeholder="E.G. TRIBUNUS_AERARII"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Descriptio Officii (Scope &amp; Mandate)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Describe the mandate and responsibilities of this dignity..."
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="input-label">Decerne Privilegia ({selectedPerms.length} Selected):</label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {PERMISSION_CATEGORIES.map(cat => (
                      <div key={cat.category}>
                        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.65rem', color: 'var(--gold-aged)', marginBottom: '8px', textTransform: 'uppercase' }}>
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
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: isChecked ? '1px solid var(--gold-primary)' : '1px solid rgba(212,175,55,0.15)',
                                  background: isChecked ? 'rgba(212,175,55,0.1)' : 'var(--bg-elevated)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <div style={{
                                  width: '16px', height: '16px', borderRadius: '3px',
                                  border: isChecked ? 'none' : '1px solid var(--text-faint)',
                                  background: isChecked ? 'var(--gold-primary)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isChecked && <Check size={12} color="#06060a" strokeWidth={3} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isChecked ? 'var(--gold-bright)' : 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                                    {p.name}
                                  </div>
                                  <div style={{ fontSize: '0.62rem', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

              <div className="modal-footer" style={{ marginTop: '20px', padding: 0 }}>
                <button type="button" onClick={() => setCreateModal(false)} className="btn btn-ghost">
                  Abrogare
                </button>
                <button type="submit" className="btn btn-primary">
                  Inscribe Titulum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: MUTARE PRIVILEGIA (EDIT ROLE) ─── */}
      {editModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WaxSealIcon size={20} color="var(--gold-primary)" />
                <h3 className="modal-title">Mutare Privilegia: {selectedRole.name}</h3>
              </div>
              <button onClick={() => setEditModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              {formError && (
                <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '6px', color: 'var(--status-danger)', fontSize: '0.8rem', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Descriptio Officii</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="input-label">Manage Permissions ({selectedPerms.length} Selected):</label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {PERMISSION_CATEGORIES.map(cat => (
                      <div key={cat.category}>
                        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.65rem', color: 'var(--gold-aged)', marginBottom: '8px', textTransform: 'uppercase' }}>
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
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: isChecked ? '1px solid var(--gold-primary)' : '1px solid rgba(212,175,55,0.15)',
                                  background: isChecked ? 'rgba(212,175,55,0.1)' : 'var(--bg-elevated)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <div style={{
                                  width: '16px', height: '16px', borderRadius: '3px',
                                  border: isChecked ? 'none' : '1px solid var(--text-faint)',
                                  background: isChecked ? 'var(--gold-primary)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isChecked && <Check size={12} color="#06060a" strokeWidth={3} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isChecked ? 'var(--gold-bright)' : 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                                    {p.name}
                                  </div>
                                  <div style={{ fontSize: '0.62rem', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

              <div className="modal-footer" style={{ marginTop: '20px', padding: 0 }}>
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-ghost">
                  Abrogare
                </button>
                <button type="submit" className="btn btn-primary">
                  Conservare Decreta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
