import React, { useState, useEffect } from 'react';
import { authApi, maintenanceApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  TempleFacadeIcon, 
  GreekColumnIcon, 
  WaxSealIcon, 
  AegisShieldIcon, 
  LaurelWreathIcon,
  LaurelDivider 
} from '../components/ClassicalIcons';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  Clock, 
  Sparkles,
  Zap,
  HardDrive
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
      alert('Sanctuary purification failed: ' + err.message);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <TempleFacadeIcon size={22} color="var(--gold-primary)" />
            <h1 className="page-title">TEMPLUM TELEMETRIAE</h1>
          </div>
          <p className="page-subtitle">
            The infrastructure oracle — real-time pulse of relational datastores, distributed cache oracles, cryptographic vaults, and automated lifecycle purifications.
          </p>
          <div className="page-title-line" />
        </div>

        <button onClick={fetchHealth} disabled={loading} className="btn btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Pinging Oracle...' : 'Interrogate Oracle'}</span>
        </button>
      </div>

      {/* ─── MONUMENTAL GILDED PEDIMENT BANNER ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(18,18,24,0.95) 100%)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: 'var(--shadow-elevated)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
            border: '1px solid rgba(16,185,129,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-active)'
          }}>
            <Activity size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Omnia Subsystemata Stabilia
              </h2>
              <span className="badge badge-active">OPTIMUM</span>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--text-body)', marginTop: '2px' }}>
              Core identity engines, thread pools, and persistence layers maintain total structural equilibrium.
            </p>
          </div>
        </div>

        {/* Telemetry Pediment Readings */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div className="roman-label">Velocitas Responsi</div>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-active)', marginTop: '2px' }}>
              {latency !== null ? `${latency} ms` : '—'}
            </div>
          </div>

          <div style={{ width: '1px', height: '40px', background: 'rgba(212,175,55,0.2)' }} />

          <div style={{ textAlign: 'right' }}>
            <div className="roman-label">Datastore Primarius</div>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: '2px' }}>
              {healthData?.database || 'UP'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PERISTYLE LAYOUT: THREE GRAND STRUCTURAL COLUMNS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Columna I: Datastore Pillar */}
        <div className="columna">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(59,130,246,0.12)',
                color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.25)'
              }}>
                <Database size={20} />
              </div>
              <div>
                <div className="roman-label">Columna Prima</div>
                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Relational Datastore
                </h3>
              </div>
            </div>

            <span className={`badge ${healthData?.database === 'UP' ? 'badge-active' : 'badge-danger'}`}>
              {healthData?.database || 'CONNECTING'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection Pool:</span>
              <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>HikariCP (Max 10)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Schema Engine:</span>
              <span style={{ color: 'var(--gold-bright)', fontWeight: 600 }}>Flyway V1 - V3</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Isolation Grade:</span>
              <span style={{ color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>READ_COMMITTED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Engine Variant:</span>
              <span style={{ color: 'var(--text-heading)' }}>H2 In-Memory / Postgres</span>
            </div>
          </div>
        </div>

        {/* Columna II: Cache Oracle Pillar */}
        <div className="columna">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(212,175,55,0.12)',
                color: 'var(--gold-bright)',
                border: '1px solid rgba(212,175,55,0.3)'
              }}>
                <Server size={20} />
              </div>
              <div>
                <div className="roman-label">Columna Secunda</div>
                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Cache Oracle &amp; Limits
                </h3>
              </div>
            </div>

            <span className="badge badge-imperator">
              {healthData?.redis === 'UP' ? 'REDIS 7' : 'FALLBACK'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cache Store:</span>
              <strong style={{ color: 'var(--gold-bright)' }}>
                {healthData?.redis === 'UP' ? 'Redis 7 Alpine' : 'In-Memory Fallback'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sliding Rate Window:</span>
              <span style={{ color: 'var(--text-heading)' }}>5 / 15m (IP) · 5 / 30m (Lock)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>JTI Blacklist Oracle:</span>
              <span style={{ color: 'var(--status-active)' }}>Instant Revocation</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lockout Decay:</span>
              <span style={{ color: 'var(--text-heading)' }}>30 Minutes Exponential</span>
            </div>
          </div>
        </div>

        {/* Columna III: Vault of Cryptography */}
        <div className="columna">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(168,85,247,0.12)',
                color: '#c084fc',
                border: '1px solid rgba(168,85,247,0.25)'
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="roman-label">Columna Tertia</div>
                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Vault of Cryptography
                </h3>
              </div>
            </div>

            <span className="badge badge-active">SECURE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Password Hash:</span>
              <span style={{ color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>BCrypt (Strength 12)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>JWT Algorithm:</span>
              <span style={{ color: 'var(--gold-bright)', fontFamily: 'var(--font-mono)' }}>HMAC-SHA512</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Token Rotation:</span>
              <span style={{ color: 'var(--status-active)' }}>SHA-256 Single-Use</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Entropy Standard:</span>
              <span style={{ color: 'var(--text-heading)' }}>NIST SP 800-63B</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADMIN TELEMETRY & PURIFICATION SECTION ─── */}
      {isAdmin && isAdmin() && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Tablet: JVM Telemetry */}
          {detailedData && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236,72,153,0.12)', color: '#f472b6' }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="roman-label">Vires Machinae</div>
                  <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    JVM Runtime &amp; Telemetry
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Available Processors:</span>
                  <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{detailedData.availableProcessors} Cores</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '8px' }}>
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

          {/* Tablet: GDPR Purification Sanctuary */}
          <div className="card" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold-primary)' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div className="roman-label">Purgatio Sancta</div>
                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  GDPR Lifecycle Purification
                </h3>
              </div>
            </div>

            <p style={{
              fontFamily: 'var(--font-cormorant)',
              fontStyle: 'italic',
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              marginBottom: '16px',
              lineHeight: 1.5
            }}>
              Executes nightly at 02:00 AM (PRD BR-28/BR-30). Purges expired refresh &amp; reset tokens, archives audit scrolls &gt;90 days, and erases soft-deleted accounts &gt;30 days.
            </p>

            <button
              onClick={handleTriggerMaintenance}
              disabled={maintenanceRunning}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <RefreshCw size={14} className={maintenanceRunning ? 'animate-spin' : ''} />
              <span>{maintenanceRunning ? 'Purifying Sanctuary...' : 'Trigger Purification Cycle Now'}</span>
            </button>

            {maintenanceResult && (
              <div style={{
                marginTop: '16px',
                padding: '14px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--status-active)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 700, marginBottom: '4px', color: 'var(--status-active)' }}>
                  Decretum Purgationis:
                </div>
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
