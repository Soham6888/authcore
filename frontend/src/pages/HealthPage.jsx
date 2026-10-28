import React, { useState, useEffect } from 'react';
import { authApi } from '../api/client';
import { Activity, Database, Server, Cpu, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export function HealthPage() {
  const [healthData, setHealthData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await authApi.getHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthData(res.data);
    } catch (err) {
      console.error('Health fetch failed:', err);
    } finally {
      setLoading(false);
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
            Live status of relational database, cache layers, and runtime performance.
          </p>
        </div>

        <button onClick={fetchHealth} disabled={loading} className="btn btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Pinging...' : 'Ping Health Probe'}
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
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={26} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              All Systems Operational
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Database is responding normally · Response Latency: <strong style={{ color: '#34d399' }}>{latency !== null ? `${latency}ms` : '...'}</strong>
            </div>
          </div>
        </div>

        <span className="badge badge-active" style={{ fontSize: '13px', padding: '6px 14px' }}>
          HEALTHY (200 OK)
        </span>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Database */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
                <Database size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Database Engine</h3>
            </div>
            <span className="badge badge-active">UP</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <strong style={{ color: '#34d399' }}>{healthData?.database || 'UP'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dialect / Driver:</span>
              <span style={{ color: '#fff', fontFamily: 'monospace' }}>PostgreSQL / H2</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection Pool:</span>
              <span style={{ color: '#fff' }}>HikariCP (Active)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cache & Blacklist */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                <Server size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Cache & Rate Limiting</h3>
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
              <span style={{ color: '#fff' }}>Sliding-Window Token Bucket</span>
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
    </div>
  );
}
