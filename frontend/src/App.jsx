import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { AuditPage } from './pages/AuditPage';
import { HealthPage } from './pages/HealthPage';
import { AccountPage } from './pages/AccountPage';
import { RoleBadge } from './components/ClassicalIcons';
import { ExternalLink } from 'lucide-react';

const TAB_TITLES = {
  dashboard: 'Dashboard',
  account:   'My Account',
  users:     'User Directory',
  roles:     'Roles & Permissions',
  audit:     'Security Audit Logs',
  health:    'System Health & Infrastructure'
};

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-void)',
        gap: '16px'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(212, 175, 55, 0.2)',
          borderTopColor: 'var(--gold-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-muted)'
        }}>
          Authenticating with AuthCore...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const primaryRole = user?.roles?.includes('SUPER_ADMIN') ? 'SUPER_ADMIN'
    : user?.roles?.includes('ADMIN') ? 'ADMIN'
    : user?.roles?.includes('MODERATOR') ? 'MODERATOR'
    : 'USER';

  return (
    <div className="app-container">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <main className="main-content">
        {/* Topbar Header */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              AuthCore
            </span>
            <span style={{ color: 'var(--text-faint)' }}>/</span>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-heading)'
            }}>
              {TAB_TITLES[currentTab] || currentTab}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <a
              href="/swagger-ui/index.html"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Swagger API Docs</span>
              <ExternalLink size={12} />
            </a>

            {/* User status chip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: '20px',
              border: 'var(--border-subtle)'
            }}>
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--status-active)',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
              }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                {user.username}
              </span>
              <RoleBadge role={primaryRole} />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          {currentTab === 'dashboard' && <Dashboard setCurrentTab={setCurrentTab} />}
          {currentTab === 'account' && <AccountPage />}
          {currentTab === 'users' && <UsersPage />}
          {currentTab === 'roles' && <RolesPage />}
          {currentTab === 'audit' && <AuditPage />}
          {currentTab === 'health' && <HealthPage />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
