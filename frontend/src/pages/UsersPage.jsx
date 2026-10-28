import React, { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  Key, 
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

  // User detail tabs: 'profile' | 'sessions' | 'logs'
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
      console.error('Failed to load users:', err);
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
      alert('Failed to revoke session: ' + err.message);
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

  const handleRemoveRole = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to remove '${roleName}' from ${selectedUser.username}?`)) return;
    try {
      await usersApi.removeRole(selectedUser.id, roleId);
      loadUsers();
      setRoleModal(false);
    } catch (err) {
      alert('Failed to remove role: ' + err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await usersApi.updateStatus(selectedUser.id, newStatus);
      loadUsers();
      setStatusModal(false);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await usersApi.deleteUser(selectedUser.id);
      loadUsers();
      setDeleteModal(false);
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>User Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Inspect accounts, manage role assignments, and supervise security states.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['', 'ACTIVE', 'SUSPENDED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === st ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                  background: statusFilter === st ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface-elevated)',
                  color: statusFilter === st ? '#fbbf24' : 'var(--text-muted)'
                }}
              >
                {st === '' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Assigned Roles</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>
                  No matching user accounts found.
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
                        background: 'linear-gradient(135deg, #374151, #1f2937)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#fbbf24'
                      }}>
                        {u.username ? u.username[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          {u.firstName ? `${u.firstName} ${u.lastName}` : u.username}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {u.roles?.map(r => (
                        <span key={r} className="badge badge-gold">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openUserDetail(u)}
                        className="btn btn-secondary btn-sm"
                        title="View Details & Sessions"
                      >
                        <Eye size={13} />
                        Details
                      </button>
                      <button
                        onClick={() => { setSelectedUser(u); setRoleModal(true); }}
                        className="btn btn-secondary btn-sm"
                        title="Assign / Remove Roles"
                      >
                        <Shield size={13} color="#f59e0b" />
                        Roles
                      </button>
                      <button
                        onClick={() => { setSelectedUser(u); setStatusModal(true); }}
                        className="btn btn-secondary btn-sm"
                        title="Change Account Status"
                      >
                        Status
                      </button>
                      {isSuperAdmin() && u.id !== currentUser?.id && (
                        <button
                          onClick={() => { setSelectedUser(u); setDeleteModal(true); }}
                          className="btn btn-danger btn-sm"
                          title="Delete User"
                        >
                          <Trash2 size={13} />
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

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div>Total: <strong>{totalElements}</strong> accounts</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span style={{ padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
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

      {/* MODAL 1: User Detail & Session Inspector */}
      {detailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setDetailModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{selectedUser.username}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'monospace' }}>{selectedUser.id}</div>
                </div>
              </div>
              <button onClick={() => setDetailModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={16} color="#60a5fa" />
                Active Refresh Token Sessions ({userSessions.length} / 5 max)
              </h4>

              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading sessions...</div>
              ) : userSessions.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '13px' }}>
                  No active refresh token sessions currently recorded for this user.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {userSessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {s.deviceInfo || 'Standard Browser'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          IP: {s.ipAddress || '127.0.0.1'} · Expires: {new Date(s.expiresAt).toLocaleString()}
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

              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '24px', marginBottom: '12px' }}>
                Recent Security Audit Events
              </h4>

              {userLogs.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '13px' }}>
                  No recent audit records.
                </div>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {userLogs.map(l => (
                    <div key={l.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{l.action}</span>
                      <span style={{ color: 'var(--text-faint)' }}>{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Role Management */}
      {roleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setRoleModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                Manage Roles: {selectedUser.username}
              </h3>
              <button onClick={() => setRoleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {modalError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {modalSuccess}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Currently Assigned Roles:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedUser.roles?.map(r => (
                    <span key={r} className="badge badge-gold" style={{ fontSize: '12px', padding: '4px 10px' }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAssignRole} style={{ marginTop: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Assign New Role:
                </label>
                <select
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  required
                  style={{ marginBottom: '16px' }}
                >
                  <option value="">Select a role to assign...</option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name} {r.isSystem ? '(System)' : ''}
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setRoleModal(false)} className="btn btn-secondary">
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

      {/* MODAL 3: Change Status */}
      {statusModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Change Status: {selectedUser.username}</h3>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Current status is <strong style={{ color: '#fff' }}>{selectedUser.status}</strong>. Select the new account status:
              </p>
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="btn btn-secondary"
                style={{ borderColor: '#10b981', color: '#34d399', justifyContent: 'flex-start' }}
              >
                <CheckCircle size={16} />
                Set to ACTIVE (Permit user login and session refreshes)
              </button>
              <button
                onClick={() => handleStatusChange('SUSPENDED')}
                className="btn btn-secondary"
                style={{ borderColor: '#ef4444', color: '#f87171', justifyContent: 'flex-start' }}
              >
                <XCircle size={16} />
                Set to SUSPENDED (Block logins immediately)
              </button>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button onClick={() => setStatusModal(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete User Confirmation */}
      {deleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                Confirm Soft Deletion
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '16px' }}>
                Are you sure you want to delete user <strong>{selectedUser.username}</strong> ({selectedUser.email})?
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginBottom: '24px' }}>
                In accordance with BR-15, this will perform a soft-delete (setting <code>deleted_at</code> timestamp) and invalidate all active user sessions immediately.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setDeleteModal(false)} className="btn btn-secondary">
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
