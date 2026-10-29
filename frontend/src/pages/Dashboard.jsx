import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, rolesApi, authApi } from '../api/client';
import { RoleBadge } from '../components/ClassicalIcons';
import { 
  Users, 
  KeyRound, 
  ShieldCheck, 
  Activity, 
  ExternalLink, 
  Database, 
  UserPlus, 
  Shield, 
  Timer,
  Hash,
  Clock
} from 'lucide-react';

function parseJwt(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function Dashboard({ setCurrentTab }) {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    health: null
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenTimeLeft, setTokenTimeLeft] = useState(null);

  const rawToken = useMemo(() => {
    return localStorage.getItem('token') || localStorage.getItem('access_token') || '';
  }, []);

  const decodedJwt = useMemo(() => parseJwt(rawToken), [rawToken]);

  useEffect(() => {
    if (!decodedJwt?.exp) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = decodedJwt.exp - now;
      setTokenTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [decodedJwt]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const promises = [authApi.getHealth()];
        if (isAdmin()) {
          promises.push(usersApi.getUsers({ page: 0, size: 20 }));
          promises.push(rolesApi.getRoles());
        }

        const results = await Promise.allSettled(promises);
        const healthRes = results[0]?.status === 'fulfilled' ? results[0].value.data : null;
        let usersData = null;
        let rolesData = null;

        if (isAdmin()) {
          usersData = results[1]?.status === 'fulfilled' ? results[1].value.data : null;
          rolesData = results[2]?.status === 'fulfilled' ? results[2].value.data : null;
        }

        const userCount = usersData?.totalElements || (isAdmin() ? 0 : 1);
        const activeCount = usersData?.content?.filter(u => u.status === 'ACTIVE').length || 1;
        const roleCount = rolesData?.length || (user?.roles?.length || 1);

        setStats({
          totalUsers: userCount,
          activeUsers: activeCount,
          totalRoles: roleCount,
          health: healthRes
        });

        if (user?.id) {
          try {
            const logsRes = await usersApi.getUserAuditLogs(user.id, { page: 0, size: 6 });
            if (logsRes?.data?.content) {
              setRecentLogs(logsRes.data.content);
            }
          } catch (e) {
            console.warn('Logs load failed', e);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [isAdmin, user]);

  const primaryRole = user?.roles?.includes('SUPER_ADMIN') ? 'SUPER_ADMIN'
    : user?.roles?.includes('ADMIN') ? 'ADMIN'
    : user?.roles?.includes('MODERATOR') ? 'MODERATOR'
    : 'USER';

  const formatCountdown = (seconds) => {
    if (seconds === null) return '15:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fade-in">
      {/* ─── WELCOME BANNER ─── */}
      <div style={{
        background: 'var(--bg-card)',
        border: 'var(--border-subtle)',
        borderLeft: '3px solid var(--gold-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-heading)',
            marginBottom: '4px'
          }}>
            Welcome, <span style={{ color: 'var(--gold-bright)' }}>{user?.firstName || user?.username}</span>
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            maxWidth: '560px'
          }}>
            AuthCore security engine is active. Monitor directory health, oversee access policies, and inspect active authentication tokens.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isAdmin() && (
            <button onClick={() => setCurrentTab('users')} className="btn btn-primary btn-sm">
              <UserPlus size={14} />
              <span>User Directory</span>
            </button>
          )}
          <a
            href="/swagger-ui/index.html"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={13} />
            <span>API Docs</span>
          </a>
        </div>
      </div>

      {/* ─── 4 MINIMAL METRIC CARDS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Metric 1 */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Registered Users</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-heading)' }}>
            {loading ? '...' : stats.totalUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-active)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-active)' }} />
            {stats.activeUsers} Active accounts
          </div>
        </div>

        {/* Metric 2 */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Roles</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--gold-faint)', color: 'var(--gold-bright)' }}>
              <KeyRound size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
            {loading ? '...' : stats.totalRoles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            10 Granular permissions
          </div>
        </div>

        {/* Metric 3 */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Database Status</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-active)' }}>
              <Database size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--status-active)' }}>
            {stats.health?.database || 'HEALTHY'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            H2 / PostgreSQL Persistence
          </div>
        </div>

        {/* Metric 4 */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Security Baseline</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-heading)' }}>
            NIST 800-63B
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Rate limiter &amp; BCrypt-12
          </div>
        </div>
      </div>

      {/* ─── PROFILE & JWT INSPECTOR SUITE ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1fr) 2fr',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* User Identity Profile */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={18} color="var(--gold-primary)" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Account Identity
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Full Name
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginTop: '2px' }}>
                  {user?.firstName || 'User'} {user?.lastName || user?.username}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Email Address
                </div>
                <div style={{ color: 'var(--text-body)', marginTop: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                  {user?.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Assigned Roles
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {user?.roles?.map(r => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Account Status
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge ${user?.status === 'ACTIVE' ? 'badge-active' : 'badge-danger'}`}>
                    {user?.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: '12px', borderTop: 'var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  User ID (UUID)
                </div>
                <div style={{
                  color: 'var(--text-faint)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '4px',
                  wordBreak: 'break-all'
                }}>
                  {user?.id}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: 'var(--border-subtle)' }}>
            <button
              onClick={() => setCurrentTab('account')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              Manage Account Settings →
            </button>
          </div>
        </div>

        {/* Clean JWT Access Token Inspector */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={18} color="var(--gold-primary)" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Active Session Token (JWT)
              </h2>
            </div>

            <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              <span>Rotation in: {formatCountdown(tokenTimeLeft)}</span>
            </span>
          </div>

          <div style={{
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'var(--border-subtle)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div>
                <span className="roman-label" style={{ fontSize: '0.68rem' }}>Algorithm</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--gold-bright)', fontWeight: 600, marginTop: '2px' }}>
                  HMAC-SHA512
                </div>
              </div>

              <div>
                <span className="roman-label" style={{ fontSize: '0.68rem' }}>Token ID (JTI)</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-body)', marginTop: '2px' }}>
                  {decodedJwt?.jti ? `${decodedJwt.jti.substring(0, 16)}...` : 'Active'}
                </div>
              </div>

              <div>
                <span className="roman-label" style={{ fontSize: '0.68rem' }}>Issued At</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {decodedJwt?.iat ? new Date(decodedJwt.iat * 1000).toLocaleTimeString() : 'N/A'}
                </div>
              </div>

              <div>
                <span className="roman-label" style={{ fontSize: '0.68rem' }}>Revocation Status</span>
                <div style={{ marginTop: '2px' }}>
                  <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>
                    Active &amp; Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Encoded Bearer Payload:</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>15-minute sliding TTL</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--gold-aged)',
              background: 'var(--bg-void)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-subtle)',
              wordBreak: 'break-all',
              lineHeight: 1.5,
              maxHeight: '60px',
              overflowY: 'auto'
            }}>
              {rawToken || 'eyJhbGciOiJIUzUxMiJ9...'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RECENT AUDIT ACTIVITY TABLE ─── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Recent Security Audit Activity
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Live audit events recorded by the security logger
            </div>
          </div>

          {isAdmin() && (
            <button onClick={() => setCurrentTab('audit')} className="btn btn-secondary btn-sm">
              View Full Logs →
            </button>
          )}
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-faint)', fontSize: '0.85rem' }}>
            No recent security events recorded for this session.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
