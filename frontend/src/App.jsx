import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { AuditPage } from './pages/AuditPage';
import { HealthPage } from './pages/HealthPage';
import { Shield, ExternalLink, User } from 'lucide-react';

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
        backgroundColor: '#0a0a0c',
        color: '#f59e0b',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(245, 158, 11, 0.2)',
          borderTopColor: '#f59e0b',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Authenticating with AuthCore...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <span>Console</span>
            <span style={{ color: 'var(--text-faint)' }}>/</span>
            <span style={{ color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>
              {currentTab === 'users' ? 'User Directory' : currentTab === 'roles' ? 'Roles & Permissions' : currentTab}
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
              <span>Swagger UI</span>
              <ExternalLink size={13} color="var(--text-faint)" />
            </a>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                {user.username}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          {currentTab === 'dashboard' && <Dashboard setCurrentTab={setCurrentTab} />}
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
