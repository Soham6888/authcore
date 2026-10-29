import React, { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/ClassicalIcons';
import { 
  Users, 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  X, 
  Smartphone, 
  AlertCircle,
  Shield
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
      console.error('Failed to load user directory:', err);
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
      setModalSuccess(`Role '${targetRole}' assigned successfully!`);
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
      alert('Status update failed: ' + err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await usersApi.deleteUser(selectedUser.id);
      loadUsers();
      setDeleteModal(false);
    } catch (err) {
      alert('Soft delete failed: ' + err.message);
    }
  };

  return (
    <div className="fade-in">
      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">USER DIRECTORY</h1>
          <p className="page-subtitle">
            Inspect accounts, manage role assignments, examine active device sessions, and supervise account status.
          </p>
          <div className="page-title-line" />
        </div>
      </div>

      {/* ─── FILTER AND SEARCH FORUM ─── */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: '', label: 'All Statuses' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'SUSPENDED', label: 'Suspended' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`btn btn-sm ${statusFilter === st.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.72rem' }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Status</th>
                <th>Assigned Roles</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ display: 'block', margin: '0 auto 10px' }} />
                    <span>Loading directory...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-faint)' }}>
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--gold-bronze), var(--gold-aged))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: '#08080b'
                        }}>
                          {u.username ? u.username[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                            {u.firstName ? `${u.firstName} ${u.lastName}` : u.username}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-danger'}`}>
                        {u.status}
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
                          title="View Details & Sessions"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setRoleModal(true); }}
                          className="btn btn-secondary btn-sm"
                          title="Assign Roles"
                        >
                          <Shield size={12} color="var(--gold-primary)" />
                          <span>Roles</span>
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setStatusModal(true); }}
                          className="btn btn-ghost btn-sm"
                          title="Change Status"
                          style={{ border: 'var(--border-subtle)' }}
                        >
                          Status
                        </button>
                        {isSuperAdmin() && u.id !== currentUser?.id && (
                          <button
                            onClick={() => { setSelectedUser(u); setDeleteModal(true); }}
                            className="btn btn-danger btn-sm"
                            title="Soft Delete User"
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

      {/* ─── PAGINATION ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div>Total: <strong>{totalElements}</strong> accounts</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span style={{ padding: '4px 10px', background: 'var(--bg-surface)', borderRadius: '4px', border: 'var(--border-subtle)', fontSize: '0.75rem' }}>
            Page {page + 1}
          </span>
          <button
            disabled={(page + 1) * size >= totalElements}
            onClick={() => setPage(p => p + 1)}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* ─── MODAL 1: USER DETAIL & SESSIONS ─── */}
      {detailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setDetailModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-bronze), var(--gold-aged))', color: '#08080b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="modal-title">{selectedUser.username}</h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{selectedUser.id}</div>
                </div>
              </div>
              <button onClick={() => setDetailModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Smartphone size={15} color="var(--gold-primary)" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Active Refresh Sessions ({userSessions.length} / 5 max)
                </h4>
              </div>

              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading sessions...</div>
              ) : userSessions.length === 0 ? (
                <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
                  No active refresh sessions found for this user.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {userSessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: 'var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                          {s.deviceInfo || 'Standard Web Browser'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          IP: {s.ipAddress || '127.0.0.1'} · Expires: {new Date(s.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '20px', marginBottom: '10px' }}>
                Recent Security Audit Logs
              </h4>

              {userLogs.length === 0 ? (
                <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
                  No recent audit records.
                </div>
              ) : (
                <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '6px' }}>
                  {userLogs.map(l => (
                    <div key={l.id} style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{l.action}</span>
                      <span style={{ color: 'var(--text-faint)' }}>{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: MANAGE ROLES ─── */}
      {roleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setRoleModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">
                Manage Roles: {selectedUser.username}
              </h3>
              <button onClick={() => setRoleModal(false)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {modalError && (
                <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', color: 'var(--status-danger)', fontSize: '0.8rem', marginBottom: '14px' }}>
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div style={{ padding: '10px 14px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: 'var(--radius-md)', color: 'var(--status-active)', fontSize: '0.8rem', marginBottom: '14px' }}>
                  {modalSuccess}
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Currently Assigned Roles:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedUser.roles?.map(r => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
              </div>

              <form onSubmit={handleAssignRole} style={{ marginTop: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Assign Additional Role:
                </label>
                <select
                  className="input-field"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  required
                  style={{ marginBottom: '16px' }}
                >
                  <option value="">Select a role to assign...</option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name} {r.isSystem ? '(System Role)' : ''}
                    </option>
                  ))}
                </select>

                <div className="modal-footer" style={{ padding: 0 }}>
                  <button type="button" onClick={() => setRoleModal(false)} className="btn btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Assign Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: STATUS ─── */}
      {statusModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Change Status: {selectedUser.username}</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>
                Current status is <strong style={{ color: 'var(--gold-bright)' }}>{selectedUser.status}</strong>. Choose updated status:
              </p>
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="btn btn-secondary"
                style={{ borderColor: 'var(--status-active)', color: 'var(--status-active)', justifyContent: 'flex-start' }}
              >
                <CheckCircle size={15} />
                <span>Set to ACTIVE (Allow login and session refreshes)</span>
              </button>
              <button
                onClick={() => handleStatusChange('SUSPENDED')}
                className="btn btn-secondary"
                style={{ borderColor: 'var(--status-danger)', color: 'var(--status-danger)', justifyContent: 'flex-start' }}
              >
                <XCircle size={15} />
                <span>Set to SUSPENDED (Block logins immediately)</span>
              </button>
              <div className="modal-footer" style={{ padding: 0, marginTop: '6px' }}>
                <button onClick={() => setStatusModal(false)} className="btn btn-ghost">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SOFT DELETE ─── */}
      {deleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                Confirm Soft Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '14px', lineHeight: 1.5 }}>
                Are you sure you want to soft-delete user <strong>{selectedUser.username}</strong> ({selectedUser.email})?
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                In accordance with Rule BR-15, this sets <code>deleted_at</code>, immediately revokes all active sessions, and initiates the 30-day retention window.
              </div>
              <div className="modal-footer" style={{ padding: 0 }}>
                <button onClick={() => setDeleteModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button onClick={handleDeleteUser} className="btn btn-danger">
                  Delete User Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
