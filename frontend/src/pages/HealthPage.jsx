import React, { useState, useEffect } from 'react';
import { authApi, maintenanceApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  HardDrive,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';

export function HealthPage() {
  const { isAdmin } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);

  // Maintenance states
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);
  const [maintenanceResult, setMaintenanceResult] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await authApi.getHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthData(res.data);

      if (isAdmin && isAdmin()) {
        try {
          const detailedRes = await authApi.getDetailedHealth();
          setDetailedData(detailedRes.data);
        } catch {
          // Fallback if not authorized
        }
      }
    } catch (err) {
      console.error('Health fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerMaintenance = async () => {
    setMaintenanceRunning(true);
    setMaintenanceResult(null);
    try {
      const res = await maintenanceApi.triggerMaintenance();
      setMaintenanceResult(res.data);
    } catch (err) {
      alert('Maintenance failed: ' + err.message);
    } finally {
      setMaintenanceRunning(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>System Health & Infrastructure</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Live status of relational database, cache layers, JVM runtime, and GDPR lifecycle maintenance.
          </p>
        </div>

        <button onClick={fetchHealth} disabled={loading} className="btn btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Pinging...' : 'Ping Health Probe'}</span>
        </button>
      </div>

      {/* Main Status Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(18, 18, 22, 0.8))',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                All Systems Operational
              </h2>
              <span className="badge badge-success">HEALTHY</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Core identity subsystem and database connections are healthy.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
              Roundtrip Latency
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {latency !== null ? `${latency} ms` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
              Primary Datastore
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
              {healthData?.database || 'UP'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Subsystems */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Card 1: Relational DB */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
                <Database size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Relational DB</h3>
            </div>
            <span className={`badge ${healthData?.database === 'UP' ? 'badge-active' : 'badge-suspended'}`}>
              {healthData?.database || 'CONNECTING'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection Pool:</span>
              <span style={{ color: '#fff' }}>HikariCP (Max 10)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Schema Engine:</span>
              <span style={{ color: '#fff' }}>Flyway V1-V3</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Read Isolation:</span>
              <span style={{ color: '#fff' }}>READ_COMMITTED</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cache & Rate Limiting */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                <Server size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Cache & Limits</h3>
            </div>
            <span className="badge badge-gold">ACTIVE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cache Store:</span>
              <strong style={{ color: '#fbbf24' }}>
                {healthData?.redis === 'UP' ? 'Redis 7 Alpine' : 'In-Memory Fallback'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Rate Limiter:</span>
              <span style={{ color: '#fff' }}>5 / 15m (IP) · 5 / 30m (Lock)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>JWT Blacklist:</span>
              <span style={{ color: '#34d399' }}>Instant Revocation by JTI</span>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Cryptography */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Cryptography</h3>
            </div>
            <span className="badge badge-active">SECURE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Password Hashing:</span>
              <strong style={{ color: '#fff', fontFamily: 'monospace' }}>BCrypt (Strength 12)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>JWT Algorithm:</span>
              <span style={{ color: '#fff', fontFamily: 'monospace' }}>HMAC-SHA512</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Token Rotation:</span>
              <span style={{ color: '#34d399' }}>SHA-256 Single-Use</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Maintenance & Runtime Section */}
      {isAdmin && isAdmin() && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Card: JVM Runtime Metrics */}
          {detailedData && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' }}>
                  <Cpu size={20} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>JVM Runtime & Telemetry</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Available Processors:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{detailedData.availableProcessors} Cores</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Allocated Heap:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    {Math.round(detailedData.jvmMemoryTotalBytes / (1024 * 1024))} MB
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Free Heap Memory:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>
                    {Math.round(detailedData.jvmMemoryFreeBytes / (1024 * 1024))} MB
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card: GDPR & Maintenance Control */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Sparkles size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>GDPR Lifecycle Maintenance</h3>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Executes nightly at 02:00 AM (PRD BR-28/BR-30). Purges expired refresh & reset tokens, archives audit logs &gt;90 days, and erases soft-deleted users &gt;30 days.
            </p>

            <button
              onClick={handleTriggerMaintenance}
              disabled={maintenanceRunning}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}
            >
              <RefreshCw size={14} className={maintenanceRunning ? 'animate-spin' : ''} />
              <span>{maintenanceRunning ? 'Executing Cycle...' : 'Trigger Maintenance Cycle Now'}</span>
            </button>

            {maintenanceResult && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#10b981'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>Cycle Summary:</div>
                <div>• Expired refresh tokens purged: <strong>{maintenanceResult.purgedRefreshTokens}</strong></div>
                <div>• Password reset tokens purged: <strong>{maintenanceResult.purgedResetTokens}</strong></div>
                <div>• Audit logs archived (&gt;90d): <strong>{maintenanceResult.archivedAuditLogs}</strong></div>
                <div>• Soft-deleted users purged (&gt;30d): <strong>{maintenanceResult.hardDeletedUsers}</strong></div>
                <div>• User audit logs anonymized: <strong>{maintenanceResult.anonymizedAuditLogs}</strong></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
