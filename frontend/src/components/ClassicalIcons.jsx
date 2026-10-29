import React from 'react';

export function LaurelWreathIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3C9 3 6 5 6 8C6 10 7 11.5 8.5 12.5C7 13 5.5 13.5 4.5 15C3.5 16.5 3.5 18.5 5 20C6 18.5 7.5 17.5 9 17C8.5 18.5 8.5 20 9.5 21C10.5 20 11 18.5 12 18C13 18.5 13.5 20 14.5 21C15.5 20 15.5 18.5 15 17C16.5 17.5 18 18.5 19 20C20.5 18.5 20.5 16.5 19.5 15C18.5 13.5 17 13 15.5 12.5C17 11.5 18 10 18 8C18 5 15 3 12 3Z" stroke={color} strokeWidth="1.2" fill="none"/>
      <circle cx="12" cy="12" r="2" fill={color} opacity="0.6"/>
    </svg>
  );
}

export function GreekColumnIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="3" width="14" height="2" rx="0.5" fill={color} opacity="0.9"/>
      <rect x="7" y="19" width="10" height="2" rx="0.5" fill={color} opacity="0.9"/>
      <rect x="8" y="5" width="2" height="14" rx="0.5" fill={color} opacity="0.6"/>
      <rect x="11" y="5" width="2" height="14" rx="0.5" fill={color} opacity="0.5"/>
      <rect x="14" y="5" width="2" height="14" rx="0.5" fill={color} opacity="0.6"/>
    </svg>
  );
}

export function WaxSealIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.2"/>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="0.8" opacity="0.6"/>
      <path d="M12 7L13.2 10.5H17L14.1 12.7L15.3 16.2L12 14L8.7 16.2L9.9 12.7L7 10.5H10.8L12 7Z" fill={color} opacity="0.8"/>
    </svg>
  );
}

export function ScrollIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 3C4.5 3 3 4.2 3 5.5C3 6.8 4.5 7.5 6 7.5H18C19.5 7.5 21 6.8 21 5.5C21 4.2 19.5 3 18 3H6Z" stroke={color} strokeWidth="1.2" fill="none"/>
      <path d="M6 20.5C4.5 20.5 3 19.3 3 18C3 16.7 4.5 16 6 16H18C19.5 16 21 16.7 21 18C21 19.3 19.5 20.5 18 20.5H6Z" stroke={color} strokeWidth="1.2" fill="none"/>
      <rect x="3" y="7.5" width="18" height="8.5" stroke={color} strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

export function TempleFacadeIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <polygon points="12,2 22,7 2,7" stroke={color} strokeWidth="1.2" fill="none"/>
      <rect x="2" y="7" width="20" height="1.5" fill={color} opacity="0.7"/>
      <rect x="3" y="19" width="18" height="2" fill={color} opacity="0.8"/>
      <rect x="5" y="8.5" width="2" height="10.5" fill={color} opacity="0.6"/>
      <rect x="9" y="8.5" width="2" height="10.5" fill={color} opacity="0.5"/>
      <rect x="13" y="8.5" width="2" height="10.5" fill={color} opacity="0.5"/>
      <rect x="17" y="8.5" width="2" height="10.5" fill={color} opacity="0.6"/>
    </svg>
  );
}

export function AegisShieldIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L20 5.5V11C20 15.5 16.5 19.5 12 21C7.5 19.5 4 15.5 4 11V5.5L12 2Z" stroke={color} strokeWidth="1.3" fill="none"/>
      <path d="M9 11.5L11 13.5L15.5 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function RoleBadge({ role }) {
  const map = {
    SUPER_ADMIN: { label: 'Super Admin', cls: 'badge-imperator' },
    ADMIN:       { label: 'Admin',       cls: 'badge-magistratus' },
    MODERATOR:   { label: 'Moderator',   cls: 'badge-tribunus' },
    USER:        { label: 'User',        cls: 'badge-civis' },
  };
  const entry = map[role] || { label: role, cls: 'badge-info' };
  return <span className={`badge ${entry.cls}`}>{entry.label}</span>;
}
