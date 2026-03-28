import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/markets', label: 'Markets', icon: '◉' },
  { to: '/trade', label: 'Trade', icon: '⇄' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        background: scrolled ? 'rgba(10, 14, 26, 0.95)' : '#0a0e1a',
        borderBottom: `1px solid ${scrolled ? '#1f2937' : '#1f2937'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '800',
            color: 'white',
          }}
        >
          N
        </div>
        <span
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#f9fafb',
            letterSpacing: '-0.02em',
          }}
        >
          NetWorth
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {NAV_LINKS.map(({ to, label, icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#f9fafb' : '#9ca3af',
                background: isActive ? '#1f2937' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#111827';
                  e.currentTarget.style.color = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }
              }}
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>
              {label}
            </NavLink>
          );
        })}
      </div>

      {/* Right side: Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#10b981',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          Live
        </div>
      </div>
    </nav>
  );
}
