'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { gsap } from 'gsap';

const ThemeContext = createContext();

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('ngv_theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');
  const [transitioning, setTransitioning] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    setThemeState(getInitialTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ngv_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback((e) => {
    let x, y;
    if (e && typeof e === 'object' && e.clientX != null) {
      x = e.clientX;
      y = e.clientY;
    } else {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }

    const fromDark = theme === 'dark';
    const newTheme = fromDark ? 'light' : 'dark';
    const overlay = overlayRef.current;
    if (!overlay) { setThemeState(newTheme); return; }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxDist = Math.ceil(Math.sqrt(w * w + h * h)) * 2;
    const size = maxDist;

    setTransitioning(true);
    const targetBg = newTheme === 'dark' ? '#0f1117' : '#f8f9fa';

    gsap.set(overlay, {
      display: 'block',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: targetBg,
      scale: 0,
      opacity: 1,
      transformOrigin: 'center center',
      willChange: 'transform',
    });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        setTransitioning(false);
        gsap.set(overlay, { display: 'none' });
      },
    });

    tl.to(overlay, {
      scale: 1,
      duration: 0.4,
      ease: 'power3.in',
      onStart: () => {
        setTimeout(() => { setThemeState(newTheme); }, 180);
      },
    });

    tl.to(overlay, {
      scale: 0,
      duration: 0.35,
      ease: 'power3.out',
      opacity: 0.9,
    });
  }, [theme]);

  const setTheme = useCallback((t) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, transitioning }}>
      {children}
      <div
        ref={overlayRef}
        className="fixed z-[9999] pointer-events-none"
        style={{ display: 'none' }}
      />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
