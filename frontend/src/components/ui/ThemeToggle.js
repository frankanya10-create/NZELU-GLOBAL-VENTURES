'use client';
import { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle({ collapsed = false }) {
  const { theme, toggleTheme } = useTheme();
  const btnRef = useRef(null);
  const sunRef = useRef(null);
  const moonRef = useRef(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!sunRef.current || !moonRef.current) return;
    gsap.set(sunRef.current, { opacity: isDark ? 0 : 1, scale: 1, rotate: 0 });
    gsap.set(moonRef.current, { opacity: isDark ? 1 : 0, scale: 1, rotate: 0 });
  }, []);

  useEffect(() => {
    if (!sunRef.current || !moonRef.current) return;
    const tl = gsap.timeline({ defaults: { duration: 0.35, ease: 'power3.inOut' } });
    if (isDark) {
      tl.to(sunRef.current, { opacity: 0, scale: 0.4, rotate: -90, duration: 0.2 }, 0);
      tl.to(moonRef.current, { opacity: 1, scale: 1, rotate: 0, duration: 0.3 }, '-=0.1');
    } else {
      tl.to(moonRef.current, { opacity: 0, scale: 0.4, rotate: 90, duration: 0.2 }, 0);
      tl.to(sunRef.current, { opacity: 1, scale: 1, rotate: 0, duration: 0.3 }, '-=0.1');
    }
  }, [isDark]);

  const handleToggle = useCallback((e) => {
    toggleTheme(e);
  }, [toggleTheme]);

  return (
    <button
      ref={btnRef}
      onClick={handleToggle}
      className={`relative flex items-center justify-center rounded-xl transition-colors duration-200 ${
        collapsed ? 'w-11 h-11 mx-auto' : 'w-full h-11 px-3 gap-3'
      }`}
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="relative w-5 h-5 flex items-center justify-center shrink-0">
        <svg ref={sunRef} className="absolute w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.5" />
          <line x1="12" y1="1.5" x2="12" y2="3.5" />
          <line x1="12" y1="20.5" x2="12" y2="22.5" />
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
          <line x1="1.5" y1="12" x2="3.5" y2="12" />
          <line x1="20.5" y1="12" x2="22.5" y2="12" />
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
        </svg>
        <svg ref={moonRef} className="absolute w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>

      {!collapsed && (
        <span className="text-xs font-bold tracking-wide uppercase relative z-10" style={{ color: 'var(--text-muted)' }}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}
