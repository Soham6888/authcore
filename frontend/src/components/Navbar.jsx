import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  KeyRound, 
  History, 
  Activity, 
  LogOut, 
  ExternalLink,
  User as UserIcon
} from 'lucide-react';

export function Navbar({ currentTab, setCurrentTab }) {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users, adminOnly: true },
    { id: 'roles', label: 'Roles & RBAC', icon: KeyRound, adminOnly: true },
    { id: 'audit', label: 'Audit Trail', icon: History, adminOnly: true },
    { id: 'health', label: 'Health Status', icon: Activity },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '10px', 
          background: 'linear-gradient(135deg, #f59e0b, #b45309)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <ShieldCheck size={22} color="#000" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '-0.3px', color: '#fff' }}>
            Auth<span style={{ color: '#f59e0b' }}>Core</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
            Identity & Access
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px', padding: '6px 12px', marginBottom: '4px' }}>
          Management
        </div>
        
        {navItems.map(item => {
          if (item.adminOnly && !isAdmin()) return null;
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fbbf24' : 'var(--text-muted)',
                backgroundColor: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? '#f59e0b' : 'var(--text-faint)'} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div style={{ marginTop: '24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px', padding: '6px 12px', marginBottom: '4px' }}>
          Developer Resources
        </div>

        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px' }}>⚡</span> Swagger API Docs
          </span>
          <ExternalLink size={14} color="var(--text-faint)" />
        </a>

        <a
          href="/guide.html"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            marginTop: '6px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px' }}>📖</span> 1-Click Guide
          </span>
          <ExternalLink size={14} color="var(--text-faint)" />
        </a>
      </nav>

      {/* User Session Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: '#272732', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <UserIcon size={18} color="#f59e0b" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.username || 'User'}
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
              {user?.roles?.map(r => (
                <span key={r} className="badge badge-gold" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', gap: '8px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
