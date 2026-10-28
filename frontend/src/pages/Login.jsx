import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export function Login() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = reset

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fillSuperAdmin = () => {
    setEmail('superadmin@authcore.io');
    setPassword('AdminPassword123!');
    setErrorMsg(null);
  };

  const fillUser = () => {
    setEmail('john.doe@example.com');
    setPassword('Password123!');
    setErrorMsg(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName
      });
      setSuccessMsg('Account created successfully! Logging you in...');
      setTimeout(async () => {
        await login(regEmail, regPassword);
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      const token = res.data?.resetToken;
      if (token) {
        setResetToken(token);
        setResetStep(2);
        setSuccessMsg(`Reset token generated: ${token}`);
      } else {
        setSuccessMsg('Reset instructions sent to your email.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setSuccessMsg('Password reset successful! Please log in with your new password.');
      setTimeout(() => {
        setTab('login');
        setPassword('');
        setResetStep(1);
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0c',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
        top: '-10%',
        right: '-5%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.07) 0%, transparent 70%)',
        bottom: '-10%',
        left: '-5%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            margin: '0 auto 16px auto',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #b45309)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)'
          }}>
            <ShieldCheck size={30} color="#000" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
            Auth<span style={{ color: '#f59e0b' }}>Core</span> Console
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Enterprise Authentication & RBAC Management
          </p>
        </div>

        {/* Card Box */}
        <div className="card" style={{ padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => { setTab('login'); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'login' ? '#272732' : 'transparent',
                color: tab === 'login' ? '#fbbf24' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'register' ? '#272732' : 'transparent',
                color: tab === 'register' ? '#fbbf24' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Register
            </button>
            <button
              onClick={() => { setTab('forgot'); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'forgot' ? '#272732' : 'transparent',
                color: tab === 'forgot' ? '#fbbf24' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Reset
            </button>
          </div>

          {/* Quick Test Pre-fills for Login */}
          {tab === 'login' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="#f59e0b" />
                Quick Dev Credentials
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={fillSuperAdmin}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', justifyContent: 'flex-start', borderStyle: 'dashed' }}
                >
                  ⚡ Super Admin
                </button>
                <button
                  type="button"
                  onClick={fillUser}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', justifyContent: 'flex-start', borderStyle: 'dashed' }}
                >
                  ⚡ John Doe
                </button>
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Form 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '12px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Console'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* Form 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Soham"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Patil"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="sohampatil"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="soham@example.com"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Password (NIST 800-63B)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 8 chars, Upper, Lower, Digit, Special"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  Must contain: uppercase, lowercase, number, symbol (e.g. <code>P@ssword123!</code>)
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Form 3: FORGOT / RESET */}
          {tab === 'forgot' && (
            <div>
              {resetStep === 1 ? (
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Enter your email to request a secure 15-minute password reset token:
                  </p>
                  <div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="account@company.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Generating...' : 'Get Reset Token'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Reset Token
                    </label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      New Password (Not last 5)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New NIST compliant password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Updating Password...' : 'Confirm Reset Password'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-faint)' }}>
          Powered by Spring Boot 4 · PostgreSQL 16 · Redis 7 · JWT
        </div>
      </div>
    </div>
  );
}
