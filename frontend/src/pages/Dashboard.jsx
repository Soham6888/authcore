import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, rolesApi, authApi } from '../api/client';
import { 
  Users, 
  KeyRound, 
  ShieldCheck, 
  Activity, 
  Clock, 
  ExternalLink, 
  Database, 
  Cpu, 
  UserPlus, 
  Shield, 
  AlertTriangle 
} from 'lucide-react';

export function Dashboard({ setCurrentTab }) {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    health: null
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

        let userCount = usersData?.totalElements || 0;
        let activeCount = usersData?.content?.filter(u => u.status === 'ACTIVE').length || 0;
        let roleCount = rolesData?.length || 0;

        setStats({
          totalUsers: userCount,
          activeUsers: activeCount,
          totalRoles: roleCount,
          health: healthRes
        });

        // Load audit logs if user ID available
        if (user?.id) {
          try {
            const logsRes = await usersApi.getUserAuditLogs(user.id, { page: 0, size: 8 });
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

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(18, 18, 22, 0.8))',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>👋</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>
              Welcome back, <span style={{ color: '#f59e0b' }}>{user?.firstName || user?.username}</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '600px' }}>
            AuthCore security engine is active. Monitor directory metrics, manage role permissions, and inspect live audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {isAdmin() && (
            <button onClick={() => setCurrentTab('users')} className="btn btn-primary">
              <UserPlus size={16} />
              Manage Users
            </button>
          )}
          <a href="/swagger-ui/index.html" target="_blank" rel="noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} />
            API Swagger
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Metric 1 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Registered Users</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            {loading ? '...' : stats.totalUsers}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
            {stats.activeUsers} Active accounts
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>System & Custom Roles</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
              <KeyRound size={18} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            {loading ? '...' : stats.totalRoles}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
            10 granular permissions defined
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Database Health</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
              <Database size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.5px' }}>
            {stats.health?.database || 'UP'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
            H2 / PostgreSQL Persistence
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Security Layer</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            NIST 800-63B
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
            Sliding-window rate limiter active
          </div>
        </div>
      </div>

      {/* Main Grid: Profile Info & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* User Profile Card */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#f59e0b" />
            Your Identity Profile
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text-faint)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                Full Name
              </div>
              <div style={{ fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                {user?.firstName || 'Admin'} {user?.lastName || 'User'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-faint)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                Email
              </div>
              <div style={{ color: '#fff', marginTop: '2px', fontFamily: 'monospace' }}>
                {user?.email}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-faint)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                Assigned Roles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {user?.roles?.map(r => (
                  <span key={r} className="badge badge-gold">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-faint)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                Account Status
              </div>
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-active">
                  {user?.status || 'ACTIVE'}
                </span>
              </div>
            </div>

            <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-faint)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                User ID (UUID)
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace', marginTop: '4px', wordBreak: 'break-all' }}>
                {user?.id}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#60a5fa" />
              Security Audit Activity
            </h2>
            {isAdmin() && (
              <button onClick={() => setCurrentTab('audit')} className="btn btn-secondary btn-sm">
                View Full Log
              </button>
            )}
          </div>

          {recentLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
              No recent audit records found for this session.
            </div>
          ) : (
            <div className="table-container">
              <table>
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
                        <span className="badge badge-neutral" style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
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
    </div>
  );
}
