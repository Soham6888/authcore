import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, usersApi } from '../api/client';
import { 
  WaxSealIcon, 
  GreekColumnIcon, 
  AegisShieldIcon, 
  LaurelWreathIcon, 
  RoleBadge,
  LaurelDivider 
} from '../components/ClassicalIcons';
import { 
  User, 
  Shield, 
  Key, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Trash2, 
  LogOut,
  Clock,
  Globe,
  Save,
  Check
} from 'lucide-react';

/* ─── Roman Password Strength Grader ─── */
const ROMAN_LEVELS = [
  { level: 'I',   label: 'Infirma',  color: '#ef4444' },
  { level: 'II',  label: 'Debilis',  color: '#d97706' },
  { level: 'III', label: 'Media',    color: '#f59e0b' },
  { level: 'IV',  label: 'Fortis',   color: '#10b981' },
  { level: 'V',   label: 'Optima',   color: '#d4af37' },
];

export function AccountPage() {
  const { user, refreshProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'sessions' | 'privacy'

  // Profile edit states
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(null);
  const [passError, setPassError] = useState(null);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionActionMsg, setSessionActionMsg] = useState(null);

  // Danger zone modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // NIST Password Policy Requirements
  const passChecks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /[0-9]/.test(newPassword),
    symbol: /[^a-zA-Z0-9]/.test(newPassword),
  };
  const passedCount = Object.values(passChecks).filter(Boolean).length;
  const isPassValid = passedCount === 5;

  // Fetch active sessions
  const fetchSessions = async () => {
    if (!user?.id) return;
    setSessionsLoading(true);
    try {
      const res = await usersApi.getUserSessions(user.id);
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load citizen sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await usersApi.updateProfile(user.id, { firstName, lastName });
      setProfileSuccess('Citizen inscriptio amended successfully.');
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      setProfileError(err.message || 'Failed to amend profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('New key confirmation does not match.');
      return;
    }
    if (!isPassValid) {
      setPassError('New key does not satisfy NIST SP 800-63B requirements.');
      return;
    }

    setPassLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPassSuccess('Secret key renewed successfully! The new key must be presented upon next admission.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.message || 'Key alteration failed. Verify current secret.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await usersApi.revokeSession(user.id, sessionId);
      setSessionActionMsg('Tessera sessionis banished.');
      fetchSessions();
      setTimeout(() => setSessionActionMsg(null), 3000);
    } catch (err) {
      alert('Revocation failed: ' + err.message);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Dissolve all active tokens and banish all remote devices from the realm?')) return;
    try {
      await authApi.logoutAll();
      logout();
    } catch (err) {
      alert('Universal logout failed: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) {
      alert('Type your username exactly to confirm damnatio memoriae.');
      return;
    }
    setDeleteLoading(true);
    try {
      await usersApi.deleteUser(user.id);
      alert('Damnatio decree recorded. 30-day grace period initiated prior to permanent erasure.');
      logout();
    } catch (err) {
      alert('Damnatio execution failed: ' + err.message);
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'profile',  roman: 'I',   latin: 'Inscriptio',         label: 'Personal Profile',  icon: User },
    { id: 'security', roman: 'II',  latin: 'Securitas',          label: 'Secret Keys',       icon: Key },
    { id: 'sessions', roman: 'III', latin: 'Tesserae',           label: 'Active Devices',    icon: Smartphone },
    { id: 'privacy',  roman: 'IV',  latin: 'Damnatio Memoriae',  label: 'Data Sovereignty',  icon: Shield },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* ─── PAGE HEADER ─── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <WaxSealIcon size={22} color="var(--gold-primary)" />
          <h1 className="page-title">CIVITAS — IDENTITAS TUAS</h1>
        </div>
        <p className="page-subtitle">
          The sovereign citizen sanctuary — personal inscription details, secret key rotations, device tokens, and privacy decrees.
        </p>
        <div className="page-title-line" />
      </div>

      {/* ─── CLASSICAL TAB BAR ─── */}
      <div className="tab-bar" style={{ marginBottom: '28px' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span className="roman-label">{t.roman}.</span>
              <Icon size={14} color={isActive ? 'var(--gold-primary)' : 'var(--text-faint)'} />
              <span>{t.latin}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: INSCRIPTIO (PROFILE) ─── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Tabula Civica (Citizen Record)
                </h2>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Your official identity registered within the AuthCore codex.
                </p>
              </div>

              <RoleBadge role={user?.roles?.[0] || 'USER'} />
            </div>

            {profileSuccess && (
              <div style={{ padding: '12px 16px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: '6px', color: 'var(--status-active)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div style={{ padding: '12px 16px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '6px', color: 'var(--status-danger)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <XCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="input-group">
                  <label className="input-label">Nomen Civis (Username — Immutable)</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="input-field input-mono"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Epistula Electronica (Email — Immutable)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field input-mono"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="input-group">
                  <label className="input-label">Praenomen (First Name)</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Marcus"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Cognomen (Last Name)</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Aurelius"
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn btn-primary"
                >
                  <Save size={14} />
                  <span>{profileSaving ? 'Inscribing...' : 'Conservare Mutationes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Citizen Privileges Tablet */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '12px' }}>
              Tituli et Privilegia Concessa
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {user?.roles?.map(r => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {user?.permissions?.map(p => (
                <span key={p} className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SECURITAS (PASSWORD) ─── */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Key size={20} color="var(--gold-primary)" />
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Renovatio Clavis (Secret Key Chamber)
              </h2>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Enforcing NIST SP 800-63B standards with BCrypt / Argon2id cost-12 hashing and history prevention across past 5 secrets.
            </p>

            {passSuccess && (
              <div style={{ padding: '12px 16px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: '6px', color: 'var(--status-active)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <CheckCircle2 size={16} />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div style={{ padding: '12px 16px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '6px', color: 'var(--status-danger)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <XCircle size={16} />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Clavis Activa (Current Secret)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="input-field"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="input-group">
                  <label className="input-label">Clavis Nova (New Secret)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter robust new key"
                      className="input-field"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Confirma Clavem Novam</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-inscribe new key"
                    className="input-field"
                  />
                </div>
              </div>

              {/* 5-Column Roman Numeral NIST Strength Indicator */}
              <div style={{ background: 'var(--bg-void)', padding: '16px 20px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="roman-label">Gradus Firmitatis NIST SP 800-63B:</span>
                  <span style={{
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: passedCount > 0 ? ROMAN_LEVELS[passedCount - 1].color : 'var(--text-faint)'
                  }}>
                    {passedCount > 0 ? `${ROMAN_LEVELS[passedCount - 1].level}. ${ROMAN_LEVELS[passedCount - 1].label}` : 'Non Inscriptum'}
                  </span>
                </div>

                {/* Roman Column Pill Bars */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {ROMAN_LEVELS.map((lvl, i) => (
                    <div
                      key={lvl.level}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: passedCount > i ? lvl.color : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s'
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.75rem' }}>
                  <div style={{ color: passChecks.length ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.length ? <Check size={12} strokeWidth={3} /> : '•'} Min. VIII (8) Characteres
                  </div>
                  <div style={{ color: passChecks.upper ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.upper ? <Check size={12} strokeWidth={3} /> : '•'} Littera Maiuscula (A-Z)
                  </div>
                  <div style={{ color: passChecks.lower ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.lower ? <Check size={12} strokeWidth={3} /> : '•'} Littera Minuscula (a-z)
                  </div>
                  <div style={{ color: passChecks.digit ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.digit ? <Check size={12} strokeWidth={3} /> : '•'} Numerus Digitus (0-9)
                  </div>
                  <div style={{ color: passChecks.symbol ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.symbol ? <Check size={12} strokeWidth={3} /> : '•'} Sigillum Unicum (!@#$)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={passLoading || !isPassValid}
                  className="btn btn-primary"
                >
                  <Key size={14} />
                  <span>{passLoading ? 'Sealing...' : 'Inscribe Novam Clavem'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 3: TESSERAE (ACTIVE SESSIONS) ─── */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Tesserae Sessionis (Active Device Tokens)
                </h2>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Manage authenticated devices carrying refresh tokens. Max V (5) concurrent sessions permitted (PRD BR-13).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={fetchSessions} disabled={sessionsLoading} className="btn btn-secondary btn-sm">
                  <RefreshCw size={13} className={sessionsLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button onClick={handleLogoutAll} className="btn btn-danger btn-sm">
                  <LogOut size={13} />
                  <span>Universal Expulsio (All Devices)</span>
                </button>
              </div>
            </div>

            {sessionActionMsg && (
              <div style={{ padding: '10px 14px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: '6px', color: 'var(--status-active)', fontSize: '0.82rem', marginBottom: '16px' }}>
                {sessionActionMsg}
              </div>
            )}

            {sessionsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ display: 'block', margin: '0 auto 12px' }} />
                <span>Interrogating active tesserae...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
                Nullae tesserae inventae — No active remote sessions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessions.map(s => (
                  <div
                    key={s.id}
                    style={{
                      padding: '16px 20px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid rgba(212,175,55,0.15)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold-bright)'
                      }}>
                        <Globe size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                            IP: {s.ipAddress || '127.0.0.1'}
                          </span>
                          <span className="badge badge-active" style={{ fontSize: '0.55rem' }}>VALIDA</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {s.userAgent || 'Web Browser'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                          <span>Inscriptum: {new Date(s.createdAt).toLocaleString()}</span>
                          <span>Cadit: {new Date(s.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Banish Token
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: DAMNATIO MEMORIAE (PRIVACY & GDPR) ─── */}
      {activeTab === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Shield size={20} color="var(--gold-primary)" />
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Sovereignty &amp; Damnatio Memoriae
              </h2>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              In compliance with GDPR and AuthCore Decrees BR-29 &amp; BR-30, citizens retain absolute sovereignty over their identity data.
            </p>

            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              marginBottom: '28px',
              fontSize: '0.85rem',
              color: 'var(--text-body)',
              lineHeight: 1.6
            }}>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 700, color: 'var(--gold-bright)', marginBottom: '8px', fontSize: '0.85rem' }}>
                Decretum Retensionis — XXX (30) Diebus Window:
              </div>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Initiating Damnatio places the account into an irrevocable <strong>30-day soft-retention window</strong>.</li>
                <li>All active tokens and sessions are immediately severed upon decree.</li>
                <li>Upon expiration of the 30 days, the automated nocturnal maintenance job permanently erases all personal identity records and anonymizes audit trails.</li>
              </ul>
            </div>

            {/* Danger Zone Edict */}
            <div style={{
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.04)',
              borderRadius: 'var(--radius-md)',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--status-danger)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                <AlertTriangle size={18} />
                <span style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.08em' }}>
                  Decretum Damnationis — Request Permanent Dissolution
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Once confirmed, all credentials will be revoked immediately and scheduled for irreversible erasure.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger"
              >
                <Trash2 size={15} />
                <span>Execute Damnatio Memoriae</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--status-danger)' }}>
                <AlertTriangle size={22} />
                <h3 className="modal-title" style={{ color: 'var(--status-danger)' }}>
                  Confirmare Damnationem
                </h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '16px', lineHeight: 1.6 }}>
                This action is severe. Type your username exactly to confirm execution: <strong style={{ color: 'var(--gold-bright)' }}>{user?.username}</strong>
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type "${user?.username}" to confirm`}
                className="input-field input-mono"
                style={{ marginBottom: '20px' }}
              />

              <div className="modal-footer" style={{ padding: 0 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-ghost"
                  disabled={deleteLoading}
                >
                  Abrogare
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== user?.username || deleteLoading}
                  className="btn btn-danger"
                >
                  {deleteLoading ? 'Executing...' : 'Confirm Damnatio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
