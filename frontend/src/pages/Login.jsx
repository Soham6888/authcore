import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { AegisShieldIcon } from '../components/ClassicalIcons';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

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

const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#d4af37'];

function StrengthMeter({ password }) {
  const score = passwordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: score >= i ? STRENGTH_COLORS[score - 1] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600,
          color: STRENGTH_COLORS[score - 1] || 'var(--text-faint)'
        }}>
          {score > 0 ? STRENGTH_LABELS[score - 1] : ''}
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>
          Password Strength
        </span>
      </div>
    </div>
  );
}

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
          style={{ paddingRight: showToggle ? '38px' : '12px' }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', padding: '2px',
            }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

function Alert({ message, type = 'error' }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '10px 14px',
      background: isError ? 'var(--status-danger-bg)' : 'var(--status-active-bg)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
      borderRadius: 'var(--radius-md)',
      fontSize: '0.8rem',
      color: isError ? 'var(--status-danger)' : 'var(--status-active)',
    }}>
      {isError ? <AlertCircle size={15} style={{ marginTop: '1px', flexShrink: 0 }} /> : <CheckCircle2 size={15} style={{ marginTop: '1px', flexShrink: 0 }} />}
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

  // Forgot & Reset state
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetConfirmPw, setResetConfirmPw] = useState('');

  const resetState = useCallback(() => {
    setError('');
    setSuccess('');
    setForgotStep(1);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(loginEmail, loginPw);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (regPw !== regConfirmPw) {
      setError('Passwords do not match.'); setLoading(false); return;
    }
    try {
      await register({ username: regUsername, email: regEmail, password: regPw, firstName: regFirstName, lastName: regLastName });
      setSuccess('Account created successfully! You can now sign in.');
      setTimeout(() => { setTab('login'); setSuccess(''); }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      const token = res.data?.resetToken;
      if (token) {
        setResetToken(token);
        setSuccess('Reset token generated. Enter your new password below.');
      } else {
        setSuccess('If this email is registered, reset instructions have been sent.');
      }
      setForgotStep(2);
    } catch (err) {
      setError(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (resetNewPw !== resetConfirmPw) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, resetNewPw);
      setSuccess('Password has been reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        setLoginEmail(forgotEmail);
        setLoginPw('');
        setTab('login');
        setForgotStep(1);
        resetState();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify the reset token.');
    } finally {
      setLoading(false);
    }
  };

  const fillSuperAdmin = () => { setLoginEmail('superadmin@authcore.io'); setLoginPw('AdminPassword123!'); };
  const fillUser       = () => { setLoginEmail('john.doe@example.com');    setLoginPw('Password123!');      };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Clean Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 12px',
            background: 'var(--gold-faint)',
            border: '1px solid var(--border-gold)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AegisShieldIcon size={24} color="var(--gold-primary)" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--text-heading)',
            marginBottom: '4px',
          }}>AUTHCORE</h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}>Enterprise Identity &amp; Access Management</p>
        </div>

        {/* Clean Minimalist Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            borderBottom: 'var(--border-subtle)',
          }}>
            {[
              { id: 'login',    label: 'Sign In' },
              { id: 'register', label: 'Create Account' },
              { id: 'forgot',   label: 'Reset Password' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); resetState(); }}
                style={{
                  flex: 1, padding: '12px 6px', border: 'none', background: 'none',
                  borderBottom: `2px solid ${tab === t.id ? 'var(--gold-primary)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  fontSize: '0.8rem',
                  fontWeight: tab === t.id ? 600 : 400,
                  color: tab === t.id ? 'var(--gold-bright)' : 'var(--text-muted)',
                  marginBottom: '-1px',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Form body */}
          <div style={{ padding: '24px' }}>

            {/* ── SIGN IN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                {/* 1-click test credentials */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                  <button type="button" onClick={fillSuperAdmin} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.72rem' }}>
                    Super Admin
                  </button>
                  <button type="button" onClick={fillUser} className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: '0.72rem', border: 'var(--border-subtle)' }}>
                    Standard User
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <InputField label="Email Address" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="name@authcore.io" autoComplete="email" />
                  <InputField label="Password" type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="current-password" />
                </div>

                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setTab('forgot'); resetState(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-aged)', fontSize: '0.75rem' }}>
                    Forgot password?
                  </button>
                </div>

                <div style={{ marginTop: '14px' }}><Alert message={error} /></div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !loginEmail || !loginPw}
                  style={{ width: '100%', marginTop: '18px', height: '40px' }}
                >
                  {loading ? <><span className="spinner" style={{ width: '15px', height: '15px' }} /> Signing in...</> : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <InputField label="First Name" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} placeholder="John" autoComplete="given-name" />
                    <InputField label="Last Name" value={regLastName} onChange={e => setRegLastName(e.target.value)} placeholder="Doe" autoComplete="family-name" />
                  </div>
                  <InputField label="Username" value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="johndoe" autoComplete="username" />
                  <InputField label="Email Address" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="john.doe@example.com" autoComplete="email" />
                  <div>
                    <InputField label="Password" type="password" value={regPw} onChange={e => setRegPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="new-password" />
                    <StrengthMeter password={regPw} />
                  </div>
                  <InputField label="Confirm Password" type="password" value={regConfirmPw} onChange={e => setRegConfirmPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="new-password" />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <Alert message={error} />
                  <Alert message={success} type="success" />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !regEmail || !regPw || !regUsername}
                  style={{ width: '100%', marginTop: '16px', height: '40px' }}
                >
                  {loading ? <><span className="spinner" style={{ width: '15px', height: '15px' }} /> Registering...</> : 'Create Account'}
                </button>
              </form>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {tab === 'forgot' && (
              forgotStep === 1 ? (
                <form onSubmit={handleForgot}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Enter your registered email address to receive password reset instructions.
                  </p>
                  <InputField label="Registered Email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="user@authcore.io" autoComplete="email" />

                  <div style={{ marginTop: '12px' }}>
                    <Alert message={error} />
                    <Alert message={success} type="success" />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !forgotEmail}
                    style={{ width: '100%', marginTop: '16px', height: '40px' }}
                  >
                    {loading ? <><span className="spinner" style={{ width: '15px', height: '15px' }} /> Processing...</> : 'Send Reset Token'}
                  </button>
                  <button type="button" onClick={() => { setTab('login'); resetState(); }} className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '8px' }}>
                    ← Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Enter your reset token and your new password.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <InputField label="Reset Token" value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Enter or paste token..." />
                    <div>
                      <InputField label="New Password" type="password" value={resetNewPw} onChange={e => setResetNewPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="new-password" />
                      <StrengthMeter password={resetNewPw} />
                    </div>
                    <InputField label="Confirm New Password" type="password" value={resetConfirmPw} onChange={e => setResetConfirmPw(e.target.value)} placeholder="••••••••••••" showToggle autoComplete="new-password" />
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <Alert message={error} />
                    <Alert message={success} type="success" />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !resetToken || !resetNewPw || !resetConfirmPw}
                    style={{ width: '100%', marginTop: '16px', height: '40px' }}
                  >
                    {loading ? <><span className="spinner" style={{ width: '15px', height: '15px' }} /> Setting Password...</> : 'Set New Password'}
                  </button>
                  <button type="button" onClick={() => setForgotStep(1)} className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '8px' }}>
                    ← Re-send Reset Token
                  </button>
                </form>
              )
            )}

          </div>
        </div>

        {/* Minimal Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-faint)',
          marginTop: '16px',
        }}>
          AuthCore Enterprise Security · NIST SP 800-63B Compliant
        </p>
      </div>
    </div>
  );
}
