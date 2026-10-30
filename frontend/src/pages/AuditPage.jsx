import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, auditApi } from '../api/client';
import { 
  Search, 
  Clock, 
  X, 
  Code2, 
  FileText
} from 'lucide-react';

const ACTION_MAP = {
  USER_LOGIN:              { label: 'Login',           cls: 'badge-active' },
  USER_LOGIN_FAILED:       { label: 'Login Failed',    cls: 'badge-danger' },
  USER_REGISTERED:         { label: 'Registered',      cls: 'badge-gold' },
  USER_LOGOUT:             { label: 'Logout',          cls: 'badge-warn' },
  USER_LOGOUT_ALL:         { label: 'Logout All',      cls: 'badge-danger' },
  ROLE_ASSIGNED:           { label: 'Role Assigned',   cls: 'badge-info' },
  ROLE_REMOVED:            { label: 'Role Removed',    cls: 'badge-warn' },
  USER_STATUS_UPDATED:     { label: 'Status Updated',  cls: 'badge-info' },
  PASSWORD_CHANGED:        { label: 'Password Changed',cls: 'badge-active' },
  PASSWORD_RESET_SUCCESS:  { label: 'Password Reset',  cls: 'badge-gold' },
  USER_DELETED:            { label: 'User Deleted',    cls: 'badge-danger' },
};

export function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.roles?.some(r => {
    const name = typeof r === 'string' ? r : r?.name;
    return name === 'ADMIN' || name === 'SUPER_ADMIN' || name === 'ROLE_ADMIN' || name === 'ROLE_SUPER_ADMIN';
  });

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await auditApi.getAuditLogs({ page: 0, size: 100, action: actionFilter || undefined });
        if (res.data?.content) {
          setLogs(res.data.content);
        }
      } else if (user?.id) {
        const res = await usersApi.getUserAuditLogs(user.id, { page: 0, size: 50 });
        if (res.data?.content) {
          setLogs(res.data.content);
        }
      }
    } catch (err) {
      console.warn('Audit logs fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [user, actionFilter]);

  const filteredLogs = logs.filter(log => {
    const rawDetails = log.metadata || log.details || '';
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesSearch = !searchTerm || 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.includes(searchTerm) ||
      rawDetails.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="fade-in">
      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">SECURITY AUDIT LOGS</h1>
          <p className="page-subtitle">
            Tamper-evident, immutable audit trail of authentication events and security operations (Rules BR-25 &amp; BR-26).
          </p>
          <div className="page-title-line" />
        </div>

        <button onClick={loadAuditLogs} disabled={loading} className="btn btn-secondary btn-sm">
          <Clock size={13} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* ─── FILTER AND SEARCH FORUM ─── */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by action, IP address, or details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              className="input-field"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              style={{ fontSize: '0.82rem' }}
            >
              <option value="">All Security Events</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_REGISTERED">USER_REGISTERED</option>
              <option value="USER_LOGOUT">USER_LOGOUT</option>
              <option value="USER_LOGOUT_ALL">USER_LOGOUT_ALL</option>
              <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
              <option value="ROLE_REMOVED">ROLE_REMOVED</option>
              <option value="USER_STATUS_UPDATED">USER_STATUS_UPDATED</option>
              <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
              <option value="PASSWORD_RESET_SUCCESS">PASSWORD_RESET_SUCCESS</option>
              <option value="USER_DELETED">USER_DELETED</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Action</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ display: 'block', margin: '0 auto 10px' }} />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-faint)' }}>
                    No security events match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const meta = ACTION_MAP[log.action] || {
                    label: log.action,
                    cls: 'badge-info'
                  };

                  return (
                    <tr key={log.id}>
                      <td>
                        <span className={`badge ${meta.cls}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-faint)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.userAgent || 'Web Browser'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-body)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt || log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Code2 size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── JSON INSPECTOR MODAL ─── */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">
                Audit Record #{selectedLog.id}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--gold-bright)', fontWeight: 600, marginTop: '2px' }}>
                    {selectedLog.action}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IP Address</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-heading)', marginTop: '2px' }}>
                    {selectedLog.ipAddress || '127.0.0.1'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                    {selectedLog.userId || 'System'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', marginTop: '2px' }}>
                    {new Date(selectedLog.createdAt || selectedLog.timestamp).toISOString()}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Raw Context Payload:
                </div>
                <pre style={{
                  background: 'var(--bg-void)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--status-active)',
                  overflowX: 'auto',
                  maxHeight: '220px',
                  lineHeight: 1.5
                }}>
                  {selectedLog.metadata || selectedLog.details ? (() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.metadata || selectedLog.details), null, 2);
                    } catch {
                      return selectedLog.metadata || selectedLog.details;
                    }
                  })() : '// No additional payload parameters recorded'}
                </pre>
              </div>

              <div className="modal-footer" style={{ marginTop: '16px', padding: 0 }}>
                <button onClick={() => setSelectedLog(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
