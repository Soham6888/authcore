import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AegisShieldIcon, LaurelWreathIcon } from '../components/ClassicalIcons';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

/* ─── Password strength meter ─── */
function passwordStrength(pw) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const ROMAN_STRENGTH = ['I', 'II', 'III', 'IV', 'V'];
const STRENGTH_LABELS = ['Infirma', 'Debilis', 'Media', 'Fortis', 'Optima'];
const STRENGTH_COLORS = ['#ef4444', '#d97706', '#f59e0b', '#10b981', '#d4af37'];

function StrengthMeter({ password }) {
  const score = passwordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: score >= i ? STRENGTH_COLORS[score - 1] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.58rem', color: STRENGTH_COLORS[score - 1] || 'var(--text-faint)',
          letterSpacing: '0.1em',
        }}>
          {score > 0 ? `${ROMAN_STRENGTH[score-1]}. ${STRENGTH_LABELS[score-1]}` : ''}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)' }}>
          Vis Tessera
        </span>
      </div>
    </div>
  );
}

/* ─── Input Field ─── */
function InputField({ label, type = 'text', value, onChange, placeholder, showToggle, autoComplete }) {
  const [show, setShow] = useState(false);
  const actualType = (type === 'password' && show) ? 'text' : type;
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input-field"
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{ paddingRight: showToggle ? '40px' : '14px' }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)',
              display: 'flex', alignItems: 'center', padding: '2px',
            }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Alert ─── */
function Alert({ message, type = 'error' }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '12px 14px',
      background: isError ? 'var(--status-danger-bg)' : 'var(--status-active-bg)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
      borderRadius: '6px',
      fontSize: '0.82rem',
      color: isError ? 'var(--status-danger)' : 'var(--status-active)',
    }}>
      {isError ? <AlertCircle size={16} style={{ marginTop: '1px', flexShrink: 0 }} /> : <CheckCircle2 size={16} style={{ marginTop: '1px', flexShrink: 0 }} />}
      <span>{message}</span>
    </div>
  );
}

export function Login() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // login | register | forgot
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regConfirmPw, setRegConfirmPw] = useState('');

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');

  const resetState = useCallback(() => {
    setError(''); setSuccess('');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(loginEmail, loginPw);
    } catch (err) {
      setError(err.message || 'Authentication failed. Verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (regPw !== regConfirmPw) {
      setError('Password confirmation does not match.'); setLoading(false); return;
    }
    try {
      await register({ username: regUsername, email: regEmail, password: regPw, firstName: regFirstName, lastName: regLastName });
      setSuccess('Your inscription has been recorded. You may now enter.');
      setTimeout(() => { setTab('login'); setSuccess(''); }, 2500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setSuccess('If this address is inscribed in the Codex, a recovery scroll has been dispatched.');
  };

  const fillImperator = () => { setLoginEmail('superadmin@authcore.io'); setLoginPw('AdminPassword123!'); };
  const fillCivis     = () => { setLoginEmail('john.doe@example.com');    setLoginPw('Password123!');      };

  const tabs = [
    { id: 'login',    label: 'Ingressio',      sub: 'Login' },
    { id: 'register', label: 'Nova Inscriptio', sub: 'Register' },
    { id: 'forgot',   label: 'Recuperatio',     sub: 'Forgot Password' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background radial gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 60% at 50% 20%, rgba(212,175,55,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Decorative column lines */}
      {[15, 85].map(pct => (
        <div key={pct} style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${pct}%`, width: '1px',
          background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.08), transparent)',
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>

        {/* Temple pediment header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.04))',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'glowPulse 3s ease-in-out infinite',
          }}>
            <AegisShieldIcon size={32} color="var(--gold-primary)" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '0.2em',
            color: 'var(--text-heading)',
            marginBottom: '4px',
          }}>PORTA AUTENTICATIO</h1>
          <p style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '0.95rem',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
          }}>Gate of Imperial Admission — AuthCore IAM</p>

          {/* Laurel hairline divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3))' }} />
            <LaurelWreathIcon size={16} color="var(--gold-aged)" />
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(212,175,55,0.3), transparent)' }} />
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.06)',
          overflow: 'hidden',
        }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(212,175,55,0.15)',
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); resetState(); }}
                style={{
                  flex: 1, padding: '14px 4px', border: 'none', background: 'none',
                  borderBottom: `2px solid ${tab === t.id ? 'var(--gold-primary)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                  marginBottom: '-1px',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: '0.62rem',
                  fontWeight: 600, letterSpacing: '0.1em',
                  color: tab === t.id ? 'var(--gold-primary)' : 'var(--text-faint)',
                  textTransform: 'uppercase',
                }}>{t.label}</div>
                <div style={{
                  fontSize: '0.58rem', color: 'var(--text-faint)',
                  marginTop: '1px',
                }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Form body */}
          <div style={{ padding: '28px' }}>

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <button type="button" onClick={fillImperator} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.58rem' }}>
                    ⚡ Imperator
                  </button>
                  <button type="button" onClick={fillCivis} className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: '0.58rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    👤 Civis
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <InputField label="Email Address" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="civis@authcore.io" autoComplete="email" />
                  <InputField label="Password" type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="current-password" />
                </div>

                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setTab('forgot'); resetState(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-aged)', fontFamily: 'var(--font-cinzel)', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                    Recuperatio →
                  </button>
                </div>

                <div style={{ marginTop: '16px' }}><Alert message={error} /></div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !loginEmail || !loginPw}
                  style={{ width: '100%', marginTop: '20px', height: '44px' }}
                >
                  {loading ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Authenticating...</> : 'INGRESSIO — Enter'}
                </button>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <InputField label="First Name" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} placeholder="Marcus" autoComplete="given-name" />
                    <InputField label="Last Name" value={regLastName} onChange={e => setRegLastName(e.target.value)} placeholder="Aurelius" autoComplete="family-name" />
                  </div>
                  <InputField label="Username" value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="m.aurelius" autoComplete="username" />
                  <InputField label="Email Address" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="m.aurelius@senate.rome" autoComplete="email" />
                  <div>
                    <InputField label="Password" type="password" value={regPw} onChange={e => setRegPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="new-password" />
                    <StrengthMeter password={regPw} />
                  </div>
                  <InputField label="Confirm Password" type="password" value={regConfirmPw} onChange={e => setRegConfirmPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="new-password" />
                </div>

                <div style={{ marginTop: '14px' }}>
                  <Alert message={error} />
                  <Alert message={success} type="success" />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !regEmail || !regPw || !regUsername}
                  style={{ width: '100%', marginTop: '20px', height: '44px' }}
                >
                  {loading ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Inscribing...</> : 'INSCRIBERE — Register'}
                </button>
              </form>
            )}

            {/* ── FORGOT ── */}
            {tab === 'forgot' && (
              <form onSubmit={handleForgot}>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
                  Enter your email address to receive a recovery dispatch via the imperial post.
                </p>
                <InputField label="Registered Email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="civis@authcore.io" autoComplete="email" />

                <div style={{ marginTop: '14px' }}>
                  <Alert message={success} type="success" />
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={loading || !forgotEmail}
                  style={{ width: '100%', marginTop: '20px', height: '44px' }}
                >
                  Dispatch Recovery Scroll
                </button>
                <button type="button" onClick={() => setTab('login')} className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '8px' }}>
                  ← Return to Ingressio
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Footer inscription */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.55rem',
          color: 'var(--text-faint)',
          letterSpacing: '0.15em',
          marginTop: '20px',
          textTransform: 'uppercase',
        }}>
          AuthCore Imperial IAM · Secured by the Aegis · MMXXVI
        </p>
      </div>
    </div>
  );
}
