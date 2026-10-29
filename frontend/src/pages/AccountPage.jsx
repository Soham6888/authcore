import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, usersApi } from '../api/client';
import { RoleBadge } from '../components/ClassicalIcons';
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
  Globe,
  Save,
  Check
} from 'lucide-react';

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

  const fetchSessions = async () => {
    if (!user?.id) return;
    setSessionsLoading(true);
    try {
      const res = await usersApi.getUserSessions(user.id);
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load user sessions:', err);
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
      setProfileSuccess('Profile details updated successfully.');
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    if (!isPassValid) {
      setPassError('Password does not satisfy NIST SP 800-63B requirements.');
      return;
    }

    setPassLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPassSuccess('Password changed successfully! You will need to use your new password next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.message || 'Failed to change password. Verify your current password.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await usersApi.revokeSession(user.id, sessionId);
      setSessionActionMsg('Session revoked successfully.');
      fetchSessions();
      setTimeout(() => setSessionActionMsg(null), 3000);
    } catch (err) {
      alert('Revocation failed: ' + err.message);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? This will invalidate all your active refresh sessions.')) return;
    try {
      await authApi.logoutAll();
      logout();
    } catch (err) {
      alert('Failed to log out all sessions: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) {
      alert('Please type your username exactly to confirm deletion.');
      return;
    }
    setDeleteLoading(true);
    try {
      await usersApi.deleteUser(user.id);
      alert('Account scheduled for deletion. Data will be retained for 30 days before permanent erasure.');
      logout();
    } catch (err) {
      alert('Account deletion failed: ' + err.message);
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'profile',  label: 'Personal Profile',  icon: User },
    { id: 'security', label: 'Password & Security', icon: Key },
    { id: 'sessions', label: 'Active Devices',    icon: Smartphone },
    { id: 'privacy',  label: 'Data Privacy & GDPR', icon: Shield },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* ─── PAGE HEADER ─── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">MY ACCOUNT</h1>
        <p className="page-subtitle">
          Manage your personal profile, credentials, active device tokens, and data privacy settings.
        </p>
        <div className="page-title-line" />
      </div>

      {/* ─── TABS HEADER ─── */}
      <div className="tab-bar" style={{ marginBottom: '24px' }}>
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
              <Icon size={14} color={isActive ? 'var(--gold-primary)' : 'var(--text-muted)'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: PROFILE ─── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Personal Information
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Update your identity details registered within AuthCore.
                </p>
              </div>

              <RoleBadge role={user?.roles?.[0] || 'USER'} />
            </div>

            {profileSuccess && (
              <div style={{ padding: '10px 14px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: 'var(--radius-md)', color: 'var(--status-active)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CheckCircle2 size={15} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', color: 'var(--status-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <XCircle size={15} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Username (Immutable)</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="input-field input-mono"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Email Address (Immutable)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field input-mono"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn btn-primary"
                >
                  <Save size={13} />
                  <span>{profileSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Roles & Permissions Card */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '10px' }}>
              Assigned Roles &amp; Permissions
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {user?.roles?.map(r => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {user?.permissions?.map(p => (
                <span key={p} className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SECURITY & PASSWORD ─── */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Key size={18} color="var(--gold-primary)" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Change Account Password
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              AuthCore enforces NIST SP 800-63B standards with BCrypt cost-12 hashing and prevents reuse of your last 5 passwords.
            </p>

            {passSuccess && (
              <div style={{ padding: '10px 14px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: 'var(--radius-md)', color: 'var(--status-active)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CheckCircle2 size={15} />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', color: 'var(--status-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <XCircle size={15} />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="input-field"
                    style={{ paddingRight: '38px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter strong new password"
                      className="input-field"
                      style={{ paddingRight: '38px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Password Policy Checklist */}
              <div style={{ background: 'var(--bg-elevated)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: 'var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  NIST SP 800-63B Compliance Checklist:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '6px', fontSize: '0.75rem' }}>
                  <div style={{ color: passChecks.length ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.length ? <Check size={12} strokeWidth={3} /> : '•'} At least 8 characters
                  </div>
                  <div style={{ color: passChecks.upper ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.upper ? <Check size={12} strokeWidth={3} /> : '•'} One uppercase letter (A-Z)
                  </div>
                  <div style={{ color: passChecks.lower ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.lower ? <Check size={12} strokeWidth={3} /> : '•'} One lowercase letter (a-z)
                  </div>
                  <div style={{ color: passChecks.digit ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.digit ? <Check size={12} strokeWidth={3} /> : '•'} At least one digit (0-9)
                  </div>
                  <div style={{ color: passChecks.symbol ? 'var(--status-active)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.symbol ? <Check size={12} strokeWidth={3} /> : '•'} One special character (!@#$)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={passLoading || !isPassValid}
                  className="btn btn-primary"
                >
                  <Key size={13} />
                  <span>{passLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ACTIVE SESSIONS ─── */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Active Device Sessions
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Manage the devices currently authenticated with your account. Maximum 5 concurrent sessions allowed (Rule BR-13).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={fetchSessions} disabled={sessionsLoading} className="btn btn-secondary btn-sm">
                  <RefreshCw size={12} className={sessionsLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button onClick={handleLogoutAll} className="btn btn-danger btn-sm">
                  <LogOut size={12} />
                  <span>Log Out All Devices</span>
                </button>
              </div>
            </div>

            {sessionActionMsg && (
              <div style={{ padding: '10px 14px', background: 'var(--status-active-bg)', border: '1px solid var(--status-active)', borderRadius: 'var(--radius-md)', color: 'var(--status-active)', fontSize: '0.8rem', marginBottom: '14px' }}>
                {sessionActionMsg}
              </div>
            )}

            {sessionsLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ display: 'block', margin: '0 auto 8px' }} />
                <span>Loading active sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-faint)' }}>
                No active remote sessions found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessions.map(s => (
                  <div
                    key={s.id}
                    style={{
                      padding: '14px 18px',
                      background: 'var(--bg-elevated)',
                      border: 'var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: 'var(--gold-faint)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold-bright)'
                      }}>
                        <Globe size={16} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                            IP: {s.ipAddress || '127.0.0.1'}
                          </span>
                          <span className="badge badge-active" style={{ fontSize: '0.62rem' }}>ACTIVE</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {s.userAgent || 'Web Browser'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '2px', display: 'flex', gap: '10px' }}>
                          <span>Created: {new Date(s.createdAt).toLocaleString()}</span>
                          <span>Expires: {new Date(s.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: DATA PRIVACY & GDPR ─── */}
      {activeTab === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Shield size={18} color="var(--gold-primary)" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Data Sovereignty &amp; Account Deletion
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              In compliance with GDPR and AuthCore Rules BR-29 &amp; BR-30, users maintain full sovereignty over their account data.
            </p>

            <div style={{
              background: 'var(--bg-elevated)',
              border: 'var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px',
              fontSize: '0.82rem',
              color: 'var(--text-body)',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Retention &amp; Soft-Deletion Lifecycle:
              </div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <li>Requesting account deletion places your profile into a <strong>30-day soft-deleted retention window</strong>.</li>
                <li>All active tokens and sessions are immediately revoked upon confirmation.</li>
                <li>After 30 days, an automated maintenance job permanently purges personal identity records and anonymizes audit logs.</li>
              </ul>
            </div>

            {/* Danger Zone */}
            <div style={{
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>
                <AlertTriangle size={16} />
                <span>Danger Zone — Request Account Deletion</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Once confirmed, your account will be immediately deactivated and scheduled for permanent erasure.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger"
              >
                <Trash2 size={13} />
                <span>Delete My Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger)' }}>
                <AlertTriangle size={20} />
                <h3 className="modal-title" style={{ color: 'var(--status-danger)' }}>
                  Confirm Account Deletion
                </h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginBottom: '14px', lineHeight: 1.5 }}>
                This action is permanent after 30 days. To confirm, please type your username: <strong style={{ color: 'var(--gold-bright)' }}>{user?.username}</strong>
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type "${user?.username}" to confirm`}
                className="input-field input-mono"
                style={{ marginBottom: '16px' }}
              />

              <div className="modal-footer" style={{ padding: 0 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-ghost"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== user?.username || deleteLoading}
                  className="btn btn-danger"
                >
                  {deleteLoading ? 'Processing...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
