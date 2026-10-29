import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/client';
import { 
  ScrollIcon, 
  WaxSealIcon, 
  GreekColumnIcon, 
  LaurelWreathIcon 
} from '../components/ClassicalIcons';
import { 
  Search, 
  Filter, 
  Clock, 
  X, 
  Code2, 
  ShieldAlert, 
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

/* ─── Classical Latin Event Taxonomy ─── */
const ACTION_TRANSLATION = {
  USER_LOGIN:              { latin: 'ACCESSUS',     cls: 'badge-active',      desc: 'Citizen admission granted' },
  USER_LOGIN_FAILED:       { latin: 'INTERDICTUM',  cls: 'badge-danger',      desc: 'Failed or denied admission' },
  USER_REGISTERED:         { latin: 'INSCRIPTIO',   cls: 'badge-imperator',   desc: 'New citizen inscribed in codex' },
  USER_LOGOUT:             { latin: 'SECESSIO',     cls: 'badge-warn',        desc: 'Voluntary session departure' },
  USER_LOGOUT_ALL:         { latin: 'EXPULSIO',     cls: 'badge-danger',      desc: 'Universal session revocation' },
  ROLE_ASSIGNED:           { latin: 'MUTATIO+',     cls: 'badge-info',        desc: 'Imperial dignity conferred' },
  ROLE_REMOVED:            { latin: 'MUTATIO-',     cls: 'badge-warn',        desc: 'Dignity revoked or reduced' },
  USER_STATUS_UPDATED:     { latin: 'DECRETUM',     cls: 'badge-info',        desc: 'Citizen standing modified' },
  PASSWORD_CHANGED:        { latin: 'RENOVATIO',    cls: 'badge-active',      desc: 'Secret key rotated' },
  PASSWORD_RESET_SUCCESS:  { latin: 'RECUPERATIO',  cls: 'badge-imperator',   desc: 'Identity key recovered' },
  USER_DELETED:            { latin: 'DAMNATIO',     cls: 'badge-danger',      desc: 'Account soft-deleted (30d window)' },
};

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
    <div className="fade-in">
      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <ScrollIcon size={22} color="var(--gold-primary)" />
            <h1 className="page-title">CODEX ANNALES</h1>
          </div>
          <p className="page-subtitle">
            Tamper-evident security chronicle — immutable historical records of decrees, logins, and security transitions (BR-25 / BR-26).
          </p>
          <div className="page-title-line" />
        </div>

        <button onClick={loadAuditLogs} disabled={loading} className="btn btn-secondary btn-sm">
          <Clock size={14} />
          <span>Refresh Chronicle</span>
        </button>
      </div>

      {/* ─── FILTER AND SEARCH FORUM ─── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Classical Search Input */}
          <div className="search-bar" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} color="var(--gold-aged)" />
            <input
              type="text"
              placeholder="Search actions, IP addresses, or encrypted context..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Filter */}
          <div style={{ minWidth: '220px' }}>
            <select
              className="input-field"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              style={{ fontSize: '0.8rem' }}
            >
              <option value="">Omnia Eventa (All Actions)</option>
              <option value="USER_LOGIN">ACCESSUS — USER_LOGIN</option>
              <option value="USER_REGISTERED">INSCRIPTIO — USER_REGISTERED</option>
              <option value="USER_LOGOUT">SECESSIO — USER_LOGOUT</option>
              <option value="USER_LOGOUT_ALL">EXPULSIO — USER_LOGOUT_ALL</option>
              <option value="ROLE_ASSIGNED">MUTATIO+ — ROLE_ASSIGNED</option>
              <option value="ROLE_REMOVED">MUTATIO- — ROLE_REMOVED</option>
              <option value="USER_STATUS_UPDATED">DECRETUM — STATUS_UPDATED</option>
              <option value="PASSWORD_CHANGED">RENOVATIO — PASSWORD_CHANGED</option>
              <option value="PASSWORD_RESET_SUCCESS">RECUPERATIO — PASSWORD_RESET</option>
              <option value="USER_DELETED">DAMNATIO — USER_DELETED</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── ANNALES DATA TABLE ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Eventum (Action)</th>
                <th>Locus IP</th>
                <th>Apparatus (User Agent)</th>
                <th>Calendarium</th>
                <th style={{ textAlign: 'right' }}>Tabula (Details)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <span className="spinner-lg spinner" style={{ display: 'block', margin: '0 auto 16px' }} />
                    <span style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '1.1rem' }}>
                      Unrolling the Annales Scroll...
                    </span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>
                    <ScrollIcon size={36} color="var(--text-faint)" className="mx-auto mb-2 opacity-30" />
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '1.05rem' }}>
                      Nulla acta inventa — No security decrees match your filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const meta = ACTION_TRANSLATION[log.action] || {
                    latin: log.action,
                    cls: 'badge-info',
                    desc: 'Security event recorded'
                  };

                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${meta.cls}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                            {meta.latin}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                            [{log.action}]
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-body)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.userAgent || 'Web Browser'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Code2 size={13} />
                          <span>Inspect Payload</span>
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

      {/* ─── TABULA INSCRIPTA MODAL (JSON INSPECTOR) ─── */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WaxSealIcon size={20} color="var(--gold-primary)" />
                <h3 className="modal-title">
                  Tabula Inscripta: Eventum #{selectedLog.id}
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn-ghost" style={{ cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', background: 'var(--bg-void)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.1)' }}>
                <div>
                  <div className="roman-label">Actio Formalis</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--gold-bright)', fontWeight: 600, marginTop: '2px' }}>
                    {selectedLog.action}
                  </div>
                </div>
                <div>
                  <div className="roman-label">Locus IP</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-heading)', marginTop: '2px' }}>
                    {selectedLog.ipAddress || '127.0.0.1'}
                  </div>
                </div>
                <div>
                  <div className="roman-label">Identitas Civis</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                    {selectedLog.userId || 'System'}
                  </div>
                </div>
                <div>
                  <div className="roman-label">Hora et Tempus</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                    {new Date(selectedLog.timestamp).toISOString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="roman-label" style={{ marginBottom: '8px' }}>
                  Raw Context Payload (Tamper-Evident State):
                </div>
                <pre style={{
                  background: 'var(--bg-void)',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(212,175,55,0.2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--status-active)',
                  overflowX: 'auto',
                  maxHeight: '260px',
                  lineHeight: 1.5
                }}>
                  {selectedLog.details ? (() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })() : '// No supplemental payload parameters inscribed'}
                </pre>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', padding: 0 }}>
                <button onClick={() => setSelectedLog(null)} className="btn btn-secondary">
                  Claudere Tabulam (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
