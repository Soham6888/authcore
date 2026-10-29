import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AegisShieldIcon, LaurelWreathIcon, RoleBadge } from './ClassicalIcons';
import {
  LayoutDashboard, Users, Shield, BookOpen,
  HeartPulse, LogOut, User, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', roman: 'I',   latin: 'Forum',          label: 'Dashboard',     icon: LayoutDashboard, roles: ['SUPER_ADMIN','ADMIN','MODERATOR','USER'] },
  { id: 'account',   roman: 'II',  latin: 'Civitas',        label: 'My Account',    icon: User,            roles: ['SUPER_ADMIN','ADMIN','MODERATOR','USER'] },
  { id: 'users',     roman: 'III', latin: 'Directorum',     label: 'Users',         icon: Users,           roles: ['SUPER_ADMIN','ADMIN','MODERATOR'] },
  { id: 'roles',     roman: 'IV',  latin: 'Cursus Honorum', label: 'Roles',         icon: Shield,          roles: ['SUPER_ADMIN','ADMIN'] },
  { id: 'audit',     roman: 'V',   latin: 'Codex Annales',  label: 'Audit',         icon: BookOpen,        roles: ['SUPER_ADMIN','ADMIN'] },
  { id: 'health',    roman: 'VI',  latin: 'Templum',        label: 'Health',        icon: HeartPulse,      roles: ['SUPER_ADMIN','ADMIN'] },
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
      width: '260px',
      minWidth: '260px',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid rgba(212,175,55,0.15)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Left fluted column accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: 'linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-bronze) 50%, var(--gold-primary) 100%)',
        opacity: 0.6,
      }} />

      {/* Imperial Frieze Header */}
      <div style={{
        padding: '24px 20px 20px 24px',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AegisShieldIcon size={20} color="var(--gold-primary)" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: 'var(--gold-primary)',
            }}>AUTHCORE</div>
            <div style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '0.7rem',
              fontStyle: 'italic',
              color: 'var(--text-faint)',
              letterSpacing: '0.04em',
            }}>Imperial IAM Console</div>
          </div>
        </div>

        {/* Gold hairline divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
          marginTop: '12px',
        }} />
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.55rem',
          letterSpacing: '0.2em',
          color: 'var(--text-faint)',
          padding: '0 8px',
          marginBottom: '10px',
          textTransform: 'uppercase',
        }}>Navigatio</div>

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
                padding: '10px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))'
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '2px',
                textAlign: 'left',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(212,175,55,0.06)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  bottom: '25%',
                  width: '2px',
                  background: 'var(--gold-primary)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}

              {/* Roman numeral */}
              <span style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.6rem',
                color: isActive ? 'var(--gold-aged)' : 'var(--text-faint)',
                width: '16px',
                flexShrink: 0,
                textAlign: 'right',
              }}>{item.roman}</span>

              {/* Icon */}
              <Icon
                size={16}
                color={isActive ? 'var(--gold-primary)' : 'var(--text-faint)'}
                strokeWidth={isActive ? 2 : 1.5}
              />

              {/* Labels */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.7rem',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.08em',
                  color: isActive ? 'var(--gold-primary)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}>{item.latin}</div>
                <div style={{
                  fontSize: '0.62rem',
                  color: isActive ? 'var(--gold-aged)' : 'var(--text-faint)',
                  marginTop: '1px',
                }}>{item.label}</div>
              </div>

              {isActive && <ChevronRight size={12} color="var(--gold-aged)" />}
            </button>
          );
        })}
      </div>

      {/* Footer — Citizen Identity Plate */}
      <div style={{
        padding: '16px 16px 20px',
        borderTop: '1px solid rgba(212,175,55,0.12)',
      }}>
        {/* External link */}
        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(212,175,55,0.04)',
            border: '1px solid rgba(212,175,55,0.1)',
            color: 'var(--text-faint)',
            textDecoration: 'none',
            marginBottom: '10px',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.color = 'var(--gold-aged)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.1)'; e.currentTarget.style.color = 'var(--text-faint)'; }}
        >
          <BookOpen size={12} />
          API Codex (Swagger)
        </a>

        {/* User plate */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px',
          background: 'rgba(212,175,55,0.04)',
          border: '1px solid rgba(212,175,55,0.12)',
          borderRadius: '8px',
        }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, var(--gold-bronze), var(--gold-aged))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#06060a',
          }}>
            {(user.username || user.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.75rem',
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
            title="Logout"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-faint)',
              borderRadius: '4px',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--status-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}
