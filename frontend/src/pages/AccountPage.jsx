import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, usersApi } from '../api/client';
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
  Save
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
  const isPassValid = Object.values(passChecks).every(Boolean);

  // Fetch active sessions
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

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await usersApi.updateProfile(user.id, { firstName, lastName });
      setProfileSuccess('Profile details updated successfully');
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    if (!isPassValid) {
      setPassError('New password does not meet NIST security requirements');
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

  // Handle Revoke Single Session
  const handleRevokeSession = async (sessionId) => {
    try {
      await usersApi.revokeSession(user.id, sessionId);
      setSessionActionMsg('Session revoked successfully');
      fetchSessions();
      setTimeout(() => setSessionActionMsg(null), 3000);
    } catch (err) {
      alert('Failed to revoke session: ' + err.message);
    }
  };

  // Handle Logout All Devices
  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? This will invalidate all your sessions.')) return;
    try {
      await authApi.logoutAll();
      logout();
    } catch (err) {
      alert('Failed to log out all sessions: ' + err.message);
    }
  };

  // Handle Account Self-Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) {
      alert('Please type your username exactly to confirm deletion.');
      return;
    }
    setDeleteLoading(true);
    try {
      await usersApi.deleteUser(user.id);
      alert('Your account has been scheduled for deletion. Data will be retained for 30 days before permanent erasure.');
      logout();
    } catch (err) {
      alert('Account deletion request failed: ' + err.message);
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>Account & Security Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Manage your personal identity, password security policy, and active device sessions.
        </p>
      </div>

      {/* Tabs Header */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '28px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'profile', label: 'Personal Profile', icon: User },
          { id: 'security', label: 'Password & Security', icon: Key },
          { id: 'sessions', label: 'Active Devices', icon: Smartphone },
          { id: 'privacy', label: 'Data & GDPR', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f59e0b' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Identity & Profile Information
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your account details and security permissions across AuthCore.
            </p>

            {profileSuccess && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#10b981',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <XCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label className="form-label">Username (Immutable)</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="form-input"
                    style={{ background: 'var(--bg-surface-elevated)', opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label className="form-label">Email Address (Immutable)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input"
                    style={{ background: 'var(--bg-surface-elevated)', opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Roles & Permissions Summary */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>
              Assigned Roles & Granted Permissions
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {user?.roles?.map(r => (
                <span key={r} className="badge badge-warning" style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {r}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {user?.permissions?.map(p => (
                <span key={p} className="badge" style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Change Account Password
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              AuthCore enforces NIST SP 800-63B standards with Argon2id / BCrypt hashing and prevents reuse of your last 5 passwords.
            </p>

            {passSuccess && (
              <div style={{
                padding: '14px 18px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#10b981',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <CheckCircle2 size={18} />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div style={{
                padding: '14px 18px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <XCircle size={18} />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your existing password"
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-faint)',
                      cursor: 'pointer'
                    }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter strong new password"
                      className="form-input"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-faint)',
                        cursor: 'pointer'
                      }}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password Policy Indicators */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                  NIST SP 800-63B Compliance Checklist:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px' }}>
                  <div style={{ color: passChecks.length ? '#10b981' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.length ? <CheckCircle2 size={13} /> : <XCircle size={13} />} At least 8 characters
                  </div>
                  <div style={{ color: passChecks.upper ? '#10b981' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.upper ? <CheckCircle2 size={13} /> : <XCircle size={13} />} One uppercase letter (A-Z)
                  </div>
                  <div style={{ color: passChecks.lower ? '#10b981' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.lower ? <CheckCircle2 size={13} /> : <XCircle size={13} />} One lowercase letter (a-z)
                  </div>
                  <div style={{ color: passChecks.digit ? '#10b981' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.digit ? <CheckCircle2 size={13} /> : <XCircle size={13} />} At least one digit (0-9)
                  </div>
                  <div style={{ color: passChecks.symbol ? '#10b981' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {passChecks.symbol ? <CheckCircle2 size={13} /> : <XCircle size={13} />} One special symbol (!@#$)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={passLoading || !isPassValid}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Key size={16} />
                  <span>{passLoading ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Active Sessions */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>Active Devices & Tokens</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Manage the devices currently authenticated with your account. Max 5 concurrent sessions (PRD BR-13).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={fetchSessions} disabled={sessionsLoading} className="btn btn-secondary btn-sm">
                  <RefreshCw size={14} className={sessionsLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button onClick={handleLogoutAll} className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LogOut size={14} />
                  <span>Log Out All Devices</span>
                </button>
              </div>
            </div>

            {sessionActionMsg && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#10b981',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {sessionActionMsg}
              </div>
            )}

            {sessionsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
                Loading active sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No active remote sessions found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessions.map(s => (
                  <div
                    key={s.id}
                    style={{
                      padding: '16px 20px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
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
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b'
                      }}>
                        <Globe size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                            IP: {s.ipAddress || '127.0.0.1'}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          User Agent: {s.userAgent || 'Web Browser'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>Created: {new Date(s.createdAt).toLocaleString()}</span>
                          <span>Expires: {new Date(s.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      Revoke Session
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Privacy & GDPR */}
      {activeTab === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Data Privacy & GDPR Compliance
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              In compliance with GDPR and AuthCore BR-29/BR-30, users maintain full sovereignty over their data.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '28px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                Data Retention & Soft-Deletion Lifecycle:
              </div>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>When you request account deletion, your account is placed into a <strong>30-day soft-deleted retention window</strong>.</li>
                <li>During this 30-day window, you cannot log in, and all active authentication sessions are instantly revoked.</li>
                <li>After 30 days, an automated scheduled job permanently erases all personal identity records and anonymizes your audit log history.</li>
              </ul>
            </div>

            {/* Danger Zone */}
            <div style={{
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.04)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
                <AlertTriangle size={18} />
                <span>Danger Zone — Request Account Deletion</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Once confirmed, your account will be deactivated and scheduled for permanent hard-deletion.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 size={16} />
                <span>Delete My Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '16px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Confirm Account Deletion</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              This will immediately revoke all your active tokens and schedule your account for permanent deletion in 30 days. To confirm, please type your username: <strong style={{ color: '#fff' }}>{user?.username}</strong>
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Type "${user?.username}" to confirm`}
              className="form-input"
              style={{ marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
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
      )}
    </div>
  );
}
