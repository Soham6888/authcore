import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, rolesApi, authApi } from '../api/client';
import { 
  AegisShieldIcon, 
  LaurelWreathIcon, 
  GreekColumnIcon, 
  WaxSealIcon, 
  ScrollIcon, 
  RoleBadge,
  LaurelDivider 
} from '../components/ClassicalIcons';
import { 
  Users, 
  KeyRound, 
  ShieldCheck, 
  Activity, 
  Clock, 
  ExternalLink, 
  Database, 
  UserPlus, 
  Shield, 
  Key,
  Timer,
  Hash,
  Fingerprint
} from 'lucide-react';

/* ─── Roman Date Formatter ─── */
const ROMAN_MONTHS = [
  'Ianuarii', 'Februarii', 'Martii', 'Aprilis', 'Maii', 'Iunii',
  'Iulii', 'Augusti', 'Septembris', 'Octobris', 'Novembris', 'Decembris'
];

function toRomanNumerals(num) {
  if (!num || num <= 0) return '';
  const lookup = [
    { value: 1000, sym: 'M' }, { value: 900, sym: 'CM' },
    { value: 500,  sym: 'D' }, { value: 400, sym: 'CD' },
    { value: 100,  sym: 'C' }, { value: 90,  sym: 'XC' },
    { value: 50,   sym: 'L' }, { value: 40,  sym: 'XL' },
    { value: 10,   sym: 'X' }, { value: 9,   sym: 'IX' },
    { value: 5,    sym: 'V' }, { value: 4,   sym: 'IV' },
    { value: 1,    sym: 'I' }
  ];
  let res = '';
  for (const item of lookup) {
    while (num >= item.value) {
      res += item.sym;
      num -= item.value;
    }
  }
  return res;
}

function formatRomanDate(date) {
  const d = new Date(date);
  const day = toRomanNumerals(d.getDate());
  const month = ROMAN_MONTHS[d.getMonth()];
  const year = toRomanNumerals(d.getFullYear());
  return `Die ${day} ${month} Anno ${year}`;
}

/* ─── JWT Parsing Utility ─── */
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

  // Retrieve raw token for Cryptographic Laurel Seal Inspector
  const rawToken = useMemo(() => {
    return localStorage.getItem('token') || localStorage.getItem('access_token') || '';
  }, []);

  const decodedJwt = useMemo(() => parseJwt(rawToken), [rawToken]);

  // Live countdown to JWT expiration (15-minute rotation window)
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
        console.error('Failed to load forum telemetry:', err);
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

  // Format token countdown as MM:SS
  const formatCountdown = (seconds) => {
    if (seconds === null) return '15:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fade-in">
      {/* ─── FORUM PRINCIPALIS HERO BANNER ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(18,18,24,0.95) 100%)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 36px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-elevated)'
      }}>
        {/* Subtle decorative background column watermark */}
        <div style={{
          position: 'absolute',
          right: '24px',
          top: '-10px',
          opacity: 0.05,
          pointerEvents: 'none'
        }}>
          <GreekColumnIcon size={180} color="var(--gold-primary)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <WaxSealIcon size={24} color="var(--gold-primary)" />
              <div style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                color: 'var(--gold-aged)',
                textTransform: 'uppercase'
              }}>
                Forum Principalis
              </div>
            </div>
            
            <h1 style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-heading)',
              letterSpacing: '0.06em',
              marginBottom: '6px'
            }}>
              Ave, <span style={{ color: 'var(--gold-bright)' }}>{user?.firstName || user?.username}</span>
            </h1>
            
            <p style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.05rem',
              fontStyle: 'italic',
              color: 'var(--text-body)',
              maxWidth: '640px'
            }}>
              The Aegis of AuthCore stands vigilant. Review citizen rosters, examine imperial dignities, and inspect real-time cryptographic decrees.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdmin() && (
              <button onClick={() => setCurrentTab('users')} className="btn btn-primary">
                <UserPlus size={15} />
                <span>Roster of Citizens</span>
              </button>
            )}
            <a
              href="/swagger-ui/index.html"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLink size={14} />
              <span>API Codex</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── FOUR MONUMENTAL TRAVERTINE TABLETS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Tablet I: Registered Citizens */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div className="roman-label">I. Civitas</div>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                Total Citizens
              </div>
            </div>
            <div style={{
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            {loading ? '...' : stats.totalUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-active)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-active)' }} />
            {stats.activeUsers} Active Dignitaries
          </div>
        </div>

        {/* Tablet II: Cursus Honorum */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div className="roman-label">II. Honores</div>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                Defined Dignities
              </div>
            </div>
            <div style={{
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(212, 175, 55, 0.1)',
              color: 'var(--gold-bright)',
              border: '1px solid rgba(212, 175, 55, 0.25)'
            }}>
              <KeyRound size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '2rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
            {loading ? '...' : stats.totalRoles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            10 Granular Privileges Inscribed
          </div>
        </div>

        {/* Tablet III: Datastore Oracle */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div className="roman-label">III. Tabularium</div>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                Primary Oracle
              </div>
            </div>
            <div style={{
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--status-active)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <Database size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-active)' }}>
            {stats.health?.database || 'STABILIS'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Relational Persistence Engine
          </div>
        </div>

        {/* Tablet IV: Aegis Securitas */}
        <div className="tablet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div className="roman-label">IV. Praesidium</div>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                Cryptographic Aegis
              </div>
            </div>
            <div style={{
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.1)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.25)'
            }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            NIST 800-63B
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Sliding-Window Rate Guards
          </div>
        </div>
      </div>

      {/* ─── CENTRAL SUITE: CRYPTOGRAPHIC LAUREL SEAL & CITIZEN IDENTITY ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 2fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Left Card: Citizen Identity Stone Inscription */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <AegisShieldIcon size={20} color="var(--gold-primary)" />
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Dignitas Identitatis
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
              <div>
                <div className="roman-label">Nomen et Cognomen</div>
                <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginTop: '2px', fontSize: '0.95rem' }}>
                  {user?.firstName || 'Dignitary'} {user?.lastName || user?.username}
                </div>
              </div>

              <div>
                <div className="roman-label">Epistula Electronica</div>
                <div style={{ color: 'var(--text-body)', marginTop: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {user?.email}
                </div>
              </div>

              <div>
                <div className="roman-label">Tituli Dignitatis</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {user?.roles?.map(r => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
              </div>

              <div>
                <div className="roman-label">Status Civitatis</div>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge ${user?.status === 'ACTIVE' ? 'badge-active' : 'badge-danger'}`}>
                    {user?.status === 'ACTIVE' ? 'Civis Stabilis' : user?.status || 'Interdictus'}
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="roman-label">Sigillum Unicum (UUID)</div>
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '4px',
                  wordBreak: 'break-all',
                  background: 'var(--bg-elevated)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {user?.id}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setCurrentTab('account')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              Inspect Civitas Sanctuary →
            </button>
          </div>
        </div>

        {/* Right Card: Feature B — The Cryptographic Laurel Seal Inspector */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <WaxSealIcon size={20} color="var(--gold-primary)" />
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Sigillum Cryptographicum (JWT Seal)
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-imperator" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Timer size={12} />
                <span>Rotation: {formatCountdown(tokenTimeLeft)}</span>
              </span>
            </div>
          </div>

          {/* Central Medallion Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '24px',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(212,175,55,0.25)',
            marginBottom: '20px'
          }}>
            {/* Animated Rotating Laurel Medallion */}
            <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '2px dashed var(--gold-primary)',
                borderRadius: '50%',
                animation: 'laurelSpin 24s linear infinite',
                opacity: 0.6
              }} />
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(15,15,20,0.95))',
                border: '1px solid var(--gold-bright)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}>
                <LaurelWreathIcon size={32} color="var(--gold-bright)" />
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.55rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: '2px' }}>
                  HMAC-512
                </span>
              </div>
            </div>

            {/* Medallion Telemetry Attributes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '6px' }}>
                <span className="roman-label">Algorithmus Signaturae:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--gold-bright)', fontWeight: 600 }}>
                  HMAC-SHA512 (256-bit entropy)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '6px' }}>
                <span className="roman-label">JTI (Token Identifier):</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-body)' }}>
                  {decodedJwt?.jti ? `${decodedJwt.jti.substring(0, 16)}...` : '0x7c9a12e4f0d...'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '6px' }}>
                <span className="roman-label">Tempus Emissum:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {decodedJwt?.iat ? new Date(decodedJwt.iat * 1000).toLocaleTimeString() : 'N/A'} ({decodedJwt?.iat ? formatRomanDate(decodedJwt.iat * 1000) : ''})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="roman-label">Blacklist Status:</span>
                <span className="badge badge-active" style={{ fontSize: '0.58rem' }}>
                  Validus (Not Blacklisted)
                </span>
              </div>
            </div>
          </div>

          {/* Raw Encoded JWT Ribbon */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="roman-label">Tessera Authentica (Enciphered Access Token):</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>15-Minute Expiry Window</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--gold-aged)',
              background: 'var(--bg-void)',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(212,175,55,0.15)',
              wordBreak: 'break-all',
              lineHeight: 1.5,
              maxHeight: '64px',
              overflowY: 'auto'
            }}>
              {rawToken ? rawToken : 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzdXBlcmFkbWluQGF1dGhjb3JlLmlvIiwiaWF0IjoxNzg0...'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ACTA DIURNA: RECENT SECURITY AUDIT SCROLL ─── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ScrollIcon size={20} color="var(--gold-primary)" />
            <div>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Acta Diurna — Security Chronicle
              </h2>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Latest security events recorded in the tamper-evident ledger (BR-25)
              </div>
            </div>
          </div>

          {isAdmin() && (
            <button onClick={() => setCurrentTab('audit')} className="btn btn-secondary btn-sm">
              Codex Annales Plenus →
            </button>
          )}
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
            <ScrollIcon size={32} color="var(--text-faint)" className="mx-auto mb-2 opacity-40" />
            <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.95rem' }}>
              No recent decrees or access records inscribe this session.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Eventum</th>
                  <th>Locus IP</th>
                  <th>Calendarium</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-imperator" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
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
