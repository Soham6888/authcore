import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/client';
import { History, Search, Filter, Clock, X, Code2, ShieldAlert } from 'lucide-react';

export function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      if (user?.id) {
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
  }, [user]);

  const filteredLogs = logs.filter(log => {
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesSearch = !searchTerm || 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.includes(searchTerm) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>Security Audit Trail</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Append-only tamper-evident security event logs (BR-25 & BR-26).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search audit actions, IP addresses, or details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
            >
              <option value="">All Security Actions</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_REGISTERED">USER_REGISTERED</option>
              <option value="USER_LOGOUT">USER_LOGOUT</option>
              <option value="USER_LOGOUT_ALL">USER_LOGOUT_ALL</option>
              <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
              <option value="ROLE_REMOVED">ROLE_REMOVED</option>
              <option value="USER_STATUS_UPDATED">USER_STATUS_UPDATED</option>
              <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
              <option value="PASSWORD_RESET_SUCCESS">PASSWORD_RESET_SUCCESS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Event Action</th>
              <th>IP Address</th>
              <th>User Agent</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading audit trail...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>
                  No security events found.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="#f59e0b" />
                      <span className="badge badge-gold" style={{ fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-faint)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.userAgent || 'Mozilla/5.0'}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Code2 size={13} />
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* JSON Inspector Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  Audit Record: #{selectedLog.id}
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-faint)' }}>Action: </span>
                <span style={{ fontWeight: 600, color: '#fbbf24', fontFamily: 'monospace' }}>{selectedLog.action}</span>
              </div>
              <div style={{ marginBottom: '14px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-faint)' }}>IP Address: </span>
                <span style={{ fontFamily: 'monospace', color: '#fff' }}>{selectedLog.ipAddress}</span>
              </div>
              <div style={{ marginBottom: '14px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-faint)' }}>Timestamp: </span>
                <span style={{ color: '#fff' }}>{new Date(selectedLog.timestamp).toISOString()}</span>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Raw Context Payload:
                </div>
                <pre style={{
                  background: 'var(--bg-main)',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#34d399',
                  overflowX: 'auto',
                  maxHeight: '220px'
                }}>
                  {selectedLog.details ? (() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })() : '// No additional payload parameters'}
                </pre>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
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
