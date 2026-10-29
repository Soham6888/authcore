import React, { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  WaxSealIcon, 
  GreekColumnIcon, 
  AegisShieldIcon, 
  RoleBadge 
} from '../components/ClassicalIcons';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Shield, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  X, 
  Smartphone, 
  AlertCircle 
} from 'lucide-react';

export function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState([]);

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // User detail state
  const [userSessions, setUserSessions] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Role assignment state
  const [targetRole, setTargetRole] = useState('');
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getUsers({
        page,
        size,
        status: statusFilter || undefined,
        search: searchTerm || undefined
      });
      if (res.data) {
        setUsers(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to load citizens roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    rolesApi.getRoles().then(res => {
      if (res.data) setAvailableRoles(res.data);
    }).catch(console.warn);
  }, []);

  const openUserDetail = async (u) => {
    setSelectedUser(u);
    setDetailModal(true);
    setLoadingDetail(true);
    try {
      const [sessionsRes, logsRes] = await Promise.allSettled([
        usersApi.getUserSessions(u.id),
        usersApi.getUserAuditLogs(u.id, { page: 0, size: 10 })
      ]);
      setUserSessions(sessionsRes.status === 'fulfilled' ? sessionsRes.value.data : []);
      setUserLogs(logsRes.status === 'fulfilled' ? logsRes.value.data?.content || [] : []);
    } catch (err) {
      console.warn('Detail fetch error:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await usersApi.revokeSession(selectedUser.id, sessionId);
      setUserSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      alert('Revocation failed: ' + err.message);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    try {
      await usersApi.assignRole(selectedUser.id, targetRole);
      setModalSuccess(`Dignity '${targetRole}' conferred successfully!`);
      loadUsers();
      setTimeout(() => {
        setRoleModal(false);
        setModalSuccess(null);
      }, 1200);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await usersApi.updateStatus(selectedUser.id, newStatus);
      loadUsers();
      setStatusModal(false);
    } catch (err) {
      alert('Status alteration failed: ' + err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await usersApi.deleteUser(selectedUser.id);
      loadUsers();
      setDeleteModal(false);
    } catch (err) {
      alert('Soft deletion failed: ' + err.message);
    }
  };

  return (
    <div className="fade-in">
      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Users size={22} color="var(--gold-primary)" />
            <h1 className="page-title">DIRECTORUM CIVIUM</h1>
          </div>
          <p className="page-subtitle">
            The imperial census of registered citizens — oversee dignities, inspect active tesserae, and regulate standing.
          </p>
          <div className="page-title-line" />
        </div>
      </div>

      {/* ─── FILTER AND SEARCH FORUM ─── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Classical Search Input */}
          <div className="search-bar" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} color="var(--gold-aged)" />
            <input
              type="text"
              placeholder="Search by citizen username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: '', label: 'Omnes (All)' },
              { id: 'ACTIVE', label: 'Stabilis (Active)' },
              { id: 'SUSPENDED', label: 'Interdictus (Suspended)' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`btn btn-sm ${statusFilter === st.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.62rem' }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CENSUS DATA TABLE ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Civis (Citizen)</th>
                <th>Status</th>
                <th>Tituli Dignitatis</th>
                <th>Inscriptio (Created)</th>
                <th style={{ textAlign: 'right' }}>Actiones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <span className="spinner-lg spinner" style={{ display: 'block', margin: '0 auto 16px' }} />
                    <span style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '1.1rem' }}>
                      Consulting the Census Rolls...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '1.05rem' }}>
                      Nulli cives inventi — No matching citizens inscribed in the codex.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--gold-bronze), var(--gold-aged))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-cinzel)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: '#06060a'
                        }}>
                          {u.username ? u.username[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                            {u.firstName ? `${u.firstName} ${u.lastName}` : u.username}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-danger'}`}>
                        {u.status === 'ACTIVE' ? 'Stabilis' : 'Interdictus'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {u.roles?.map(r => (
                          <RoleBadge key={r} role={r} />
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openUserDetail(u)}
                          className="btn btn-secondary btn-sm"
                          title="Inspect Details & Sessions"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setRoleModal(true); }}
                          className="btn btn-secondary btn-sm"
                          title="Confer Dignities"
                        >
                          <Shield size={12} color="var(--gold-primary)" />
                          <span>Dignitates</span>
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setStatusModal(true); }}
                          className="btn btn-ghost btn-sm"
                          title="Alter Standing"
                          style={{ border: '1px solid var(--border-subtle)' }}
                        >
                          Status
                        </button>
                        {isSuperAdmin() && u.id !== currentUser?.id && (
                          <button
                            onClick={() => { setSelectedUser(u); setDeleteModal(true); }}
                            className="btn btn-danger btn-sm"
                            title="Soft Delete Citizen"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ROMAN PAGINATION FOOTER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div>Census: <strong>{totalElements}</strong> citizens registered</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="btn btn-secondary btn-sm"
          >
            ← Retro
          </button>
          <span style={{ padding: '5px 12px', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem' }}>
            Tabula {page + 1}
          </span>
          <button
            disabled={(page + 1) * size >= totalElements}
            onClick={() => setPage(p => p + 1)}
            className="btn btn-secondary btn-sm"
          >
            Ultra →
          </button>
        </div>
      </div>

      {/* ─── MODAL 1: CITIZEN DETAIL & SESSIONS ─── */}
      {detailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setDetailModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-bronze), var(--gold-aged))', color: '#06060a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cinzel)', fontWeight: 800 }}>
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="modal-title">{selectedUser.username}</h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{selectedUser.id}</div>
                </div>
              </div>
              <button onClick={() => setDetailModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Smartphone size={16} color="var(--gold-primary)" />
                <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Active Tesserae Sessions ({userSessions.length} / 5 max)
                </h4>
              </div>

              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading sessions...</div>
              ) : userSessions.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--bg-void)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
                  No active refresh token sessions currently recorded for this citizen.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {userSessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-void)', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                          {s.deviceInfo || 'Standard Browser'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          IP: {s.ipAddress || '127.0.0.1'} · Expires: {new Date(s.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Banish
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '24px', marginBottom: '12px' }}>
                Recent Security Audit Inscriptions
              </h4>

              {userLogs.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--bg-void)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
                  No recent audit records inscribed.
                </div>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'var(--bg-void)', borderRadius: '6px', padding: '8px' }}>
                  {userLogs.map(l => (
                    <div key={l.id} style={{ padding: '8px 10px', borderBottom: '1px solid rgba(212,175,55,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span className="badge badge-imperator" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{l.action}</span>
                      <span style={{ color: 'var(--text-faint)' }}>{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CONFER DIGNITIES (ROLES) ─── */}
      {roleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setRoleModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WaxSealIcon size={20} color="var(--gold-primary)" />
                <h3 className="modal-title">
                  Confer Dignity: {selectedUser.username}
                </h3>
              </div>
              <button onClick={() => setRoleModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {modalError && (
                <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '6px', color: 'var(--status-danger)', fontSize: '0.8rem', marginBottom: '16px' }}>
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div style={{ padding: '10px 14px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: '6px', color: 'var(--status-active)', fontSize: '0.8rem', marginBottom: '16px' }}>
                  {modalSuccess}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label className="roman-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Currently Conferred Dignities:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedUser.roles?.map(r => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
              </div>

              <form onSubmit={handleAssignRole} style={{ marginTop: '20px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Confer Additional Dignity:
                </label>
                <select
                  className="input-field"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  required
                  style={{ marginBottom: '16px' }}
                >
                  <option value="">Select a title to confer...</option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name} {r.isSystem ? '(System Dignity)' : '(Custom Dignity)'}
                    </option>
                  ))}
                </select>

                <div className="modal-footer" style={{ padding: 0 }}>
                  <button type="button" onClick={() => setRoleModal(false)} className="btn btn-ghost">
                    Abrogare
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Confer Dignity
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ALTER STANDING (STATUS) ─── */}
      {statusModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Alter Citizen Standing: {selectedUser.username}</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>
                Current standing is <strong style={{ color: 'var(--gold-bright)' }}>{selectedUser.status}</strong>. Select the updated standing decree:
              </p>
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="btn btn-secondary"
                style={{ borderColor: 'var(--status-active)', color: 'var(--status-active)', justifyContent: 'flex-start' }}
              >
                <CheckCircle size={16} />
                <span>Declare STABILIS (Active admission and token renewals allowed)</span>
              </button>
              <button
                onClick={() => handleStatusChange('SUSPENDED')}
                className="btn btn-secondary"
                style={{ borderColor: 'var(--status-danger)', color: 'var(--status-danger)', justifyContent: 'flex-start' }}
              >
                <XCircle size={16} />
                <span>Declare INTERDICTUS (Suspended — block all logins immediately)</span>
              </button>
              <div className="modal-footer" style={{ padding: 0, marginTop: '8px' }}>
                <button onClick={() => setStatusModal(false)} className="btn btn-ghost">
                  Claudere
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SOFT DELETION CONFIRMATION ─── */}
      {deleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                Confirm Soft Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '16px', lineHeight: 1.6 }}>
                Are you certain you wish to execute soft-deletion on citizen <strong>{selectedUser.username}</strong> ({selectedUser.email})?
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '24px', background: 'var(--bg-void)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.1)' }}>
                In accordance with BR-15, this sets the <code>deleted_at</code> timestamp, immediately severs all active tokens, and initiates the 30-day retention window.
              </div>
              <div className="modal-footer" style={{ padding: 0 }}>
                <button onClick={() => setDeleteModal(false)} className="btn btn-ghost">
                  Abrogare
                </button>
                <button onClick={handleDeleteUser} className="btn btn-danger">
                  Delete Citizen Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
