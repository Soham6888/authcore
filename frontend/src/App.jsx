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
import { AegisShieldIcon, LaurelWreathIcon, RoleBadge } from './components/ClassicalIcons';
import { ExternalLink } from 'lucide-react';

const TAB_TITLES = {
  dashboard: 'I. Forum Principalis',
  account:   'II. Civitas — My Identity',
  users:     'III. Directorum Civium',
  roles:     'IV. Cursus Honorum',
  audit:     'V. Codex Annales',
  health:    'VI. Templum Telemetriae'
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
        gap: '20px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          border: '3px solid rgba(212, 175, 55, 0.2)',
          borderTopColor: 'var(--gold-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.85rem',
          letterSpacing: '0.15em',
          color: 'var(--gold-primary)',
          textTransform: 'uppercase'
        }}>
          Consulting Imperial Oracle...
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
        {/* Imperial Top Header Bar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'var(--gold-aged)', letterSpacing: '0.1em' }}>
              AUTHCORE
            </span>
            <span style={{ color: 'var(--gold-hairline)' }}>/</span>
            <span style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-heading)',
              letterSpacing: '0.08em'
            }}>
              {TAB_TITLES[currentTab] || currentTab}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="/swagger-ui/index.html"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <span>API Codex</span>
              <ExternalLink size={12} />
            </a>

            {/* Active Citizen Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: '20px',
              border: '1px solid rgba(212,175,55,0.2)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--status-active)',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
              }} />
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-heading)' }}>
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
