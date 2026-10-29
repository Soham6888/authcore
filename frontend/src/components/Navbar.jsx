import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AegisShieldIcon, RoleBadge } from './ClassicalIcons';
import {
  LayoutDashboard, Users, Shield, FileText,
  Activity, LogOut, User, ChevronRight, BookOpen
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',           icon: LayoutDashboard, roles: ['SUPER_ADMIN','ADMIN','MODERATOR','USER'] },
  { id: 'account',   label: 'My Account',          icon: User,            roles: ['SUPER_ADMIN','ADMIN','MODERATOR','USER'] },
  { id: 'users',     label: 'User Directory',      icon: Users,           roles: ['SUPER_ADMIN','ADMIN','MODERATOR'] },
  { id: 'roles',     label: 'Roles & Permissions', icon: Shield,          roles: ['SUPER_ADMIN','ADMIN'] },
  { id: 'audit',     label: 'Audit Logs',          icon: FileText,        roles: ['SUPER_ADMIN','ADMIN'] },
  { id: 'health',    label: 'System Health',       icon: Activity,        roles: ['SUPER_ADMIN','ADMIN'] },
];

export function Navbar({ currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const userRoles = user.roles || [];
  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.some(r => userRoles.includes(r))
  );

  const primaryRole = userRoles.includes('SUPER_ADMIN') ? 'SUPER_ADMIN'
    : userRoles.includes('ADMIN') ? 'ADMIN'
    : userRoles.includes('MODERATOR') ? 'MODERATOR'
    : 'USER';

  return (
    <nav style={{
      width: '240px',
      minWidth: '240px',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: 'var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: 'var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'var(--gold-faint)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AegisShieldIcon size={18} color="var(--gold-primary)" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--text-heading)',
            }}>AUTHCORE</div>
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}>Identity &amp; Access</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          color: 'var(--text-faint)',
          padding: '0 10px',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Navigation
        </div>

        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--gold-faint)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '2px',
                textAlign: 'left',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '2px',
                  background: 'var(--gold-primary)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}

              <Icon
                size={16}
                color={isActive ? 'var(--gold-primary)' : 'var(--text-muted)'}
                strokeWidth={isActive ? 2 : 1.6}
              />

              <span style={{
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--gold-bright)' : 'var(--text-body)',
                flex: 1,
              }}>
                {item.label}
              </span>

              {isActive && <ChevronRight size={13} color="var(--gold-primary)" />}
            </button>
          );
        })}
      </div>

      {/* Footer Profile */}
      <div style={{
        padding: '16px',
        borderTop: 'var(--border-subtle)',
      }}>
        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.02)',
            border: 'var(--border-subtle)',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            marginBottom: '10px',
            fontSize: '0.75rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold-bright)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <BookOpen size={13} />
          <span>API Documentation (Swagger)</span>
        </a>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 10px',
          background: 'var(--bg-elevated)',
          border: 'var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, var(--gold-bronze), var(--gold-aged))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#08080b',
          }}>
            {(user.username || user.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-heading)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{user.username || user.email}</div>
            <div style={{ marginTop: '2px' }}>
              <RoleBadge role={primaryRole} />
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-muted)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--status-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
}
