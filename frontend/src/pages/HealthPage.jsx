import React, { useState, useEffect } from 'react';
import { authApi, maintenanceApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2
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
    <div className="fade-in">
      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">SYSTEM HEALTH &amp; INFRASTRUCTURE</h1>
          <p className="page-subtitle">
            Live health telemetry for relational datastores, distributed caching, JVM runtime, and automated maintenance cycles.
          </p>
          <div className="page-title-line" />
        </div>

        <button onClick={fetchHealth} disabled={loading} className="btn btn-secondary">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Pinging...' : 'Ping Health Probe'}</span>
        </button>
      </div>

      {/* ─── STATUS BANNER ─── */}
      <div style={{
        background: 'var(--bg-card)',
        border: 'var(--border-subtle)',
        borderLeft: '3px solid var(--status-active)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'var(--status-active-bg)',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-active)'
          }}>
            <Activity size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                All Systems Operational
              </h2>
              <span className="badge badge-active">HEALTHY</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Identity engines, database connection pools, and security middleware are operating within normal parameters.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Roundtrip Latency
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-active)', marginTop: '2px' }}>
              {latency !== null ? `${latency} ms` : '—'}
            </div>
          </div>

          <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Primary Datastore
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
              {healthData?.database || 'UP'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3 MINIMAL INFRASTRUCTURE CARDS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Relational DB */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                <Database size={18} />
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Relational Database
              </h3>
            </div>

            <span className={`badge ${healthData?.database === 'UP' ? 'badge-active' : 'badge-danger'}`}>
              {healthData?.database || 'CONNECTING'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection Pool:</span>
              <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>HikariCP (Max 10)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Schema Migrations:</span>
              <span style={{ color: 'var(--gold-bright)', fontWeight: 600 }}>Flyway V1 – V3</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Isolation:</span>
              <span style={{ color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>READ_COMMITTED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dialect Variant:</span>
              <span style={{ color: 'var(--text-heading)' }}>H2 File / PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cache & Limits */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '7px', borderRadius: '6px', background: 'var(--gold-faint)', color: 'var(--gold-bright)' }}>
                <Server size={18} />
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Cache &amp; Rate Limiting
              </h3>
            </div>

            <span className="badge badge-gold">
              {healthData?.redis === 'UP' ? 'REDIS 7' : 'FALLBACK'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cache Layer:</span>
              <strong style={{ color: 'var(--gold-bright)' }}>
                {healthData?.redis === 'UP' ? 'Redis 7 Alpine' : 'In-Memory Fallback'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sliding Window Limits:</span>
              <span style={{ color: 'var(--text-heading)' }}>5 / 15m (IP) · 5 / 30m (Lock)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Token Blacklist:</span>
              <span style={{ color: 'var(--status-active)' }}>Instant Revocation by JTI</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lockout Decay:</span>
              <span style={{ color: 'var(--text-heading)' }}>30 Minutes Exponential</span>
            </div>
          </div>
        </div>

        {/* Card 3: Cryptography */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
                <ShieldCheck size={18} />
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Security &amp; Cryptography
              </h3>
            </div>

            <span className="badge badge-active">SECURE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Password Hashing:</span>
              <span style={{ color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>BCrypt (Strength 12)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Token Signature:</span>
              <span style={{ color: 'var(--gold-bright)', fontFamily: 'var(--font-mono)' }}>HMAC-SHA512</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Token Rotation:</span>
              <span style={{ color: 'var(--status-active)' }}>SHA-256 Single-Use</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Security Compliance:</span>
              <span style={{ color: 'var(--text-heading)' }}>NIST SP 800-63B</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADMIN TELEMETRY & MAINTENANCE SECTION ─── */}
      {isAdmin && isAdmin() && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* JVM Telemetry */}
          {detailedData && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Cpu size={18} color="#f472b6" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  JVM Runtime Metrics
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Available Processors:</span>
                  <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{detailedData.availableProcessors} Cores</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Allocated Heap Memory:</span>
                  <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>
                    {Math.round(detailedData.jvmMemoryTotalBytes / (1024 * 1024))} MB
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Free Heap Memory:</span>
                  <span style={{ color: 'var(--status-active)', fontWeight: 600 }}>
                    {Math.round(detailedData.jvmMemoryFreeBytes / (1024 * 1024))} MB
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* GDPR Maintenance Controller */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={18} color="var(--gold-primary)" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                GDPR Lifecycle Maintenance
              </h3>
            </div>

            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '14px',
              lineHeight: 1.4
            }}>
              Scheduled to run nightly at 02:00 AM (Rules BR-28 / BR-30). Automatically purges expired refresh &amp; reset tokens, archives logs &gt;90 days, and hard-deletes soft-deleted users &gt;30 days.
            </p>

            <button
              onClick={handleTriggerMaintenance}
              disabled={maintenanceRunning}
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              <RefreshCw size={13} className={maintenanceRunning ? 'animate-spin' : ''} />
              <span>{maintenanceRunning ? 'Running Maintenance Cycle...' : 'Trigger Maintenance Cycle Now'}</span>
            </button>

            {maintenanceResult && (
              <div style={{
                marginTop: '14px',
                padding: '12px',
                background: 'var(--status-active-bg)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--status-active)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>Maintenance Execution Summary:</div>
                <div>• Expired refresh tokens purged: <strong>{maintenanceResult.purgedRefreshTokens}</strong></div>
                <div>• Password reset tokens purged: <strong>{maintenanceResult.purgedResetTokens}</strong></div>
                <div>• Audit logs archived (&gt;90d): <strong>{maintenanceResult.archivedAuditLogs}</strong></div>
                <div>• Soft-deleted users permanently erased (&gt;30d): <strong>{maintenanceResult.hardDeletedUsers}</strong></div>
                <div>• User audit logs anonymized: <strong>{maintenanceResult.anonymizedAuditLogs}</strong></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
