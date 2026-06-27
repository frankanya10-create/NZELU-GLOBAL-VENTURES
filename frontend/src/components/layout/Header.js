'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import useAuthStore from '@/store/authStore';
import { HiOutlineBell, HiOutlineBars3CenterLeft, HiOutlineXMark } from 'react-icons/hi2';

export default function Header({ title, subtitle, sidebarOpen, onSidebarToggle }) {
  const headerRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (headerRef.current) {
      gsap.set(headerRef.current, { opacity: 0, y: -10 });
      gsap.to(headerRef.current, {
        opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
        clearProps: 'opacity,transform',
      });
    }
  }, [title]);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header
      ref={headerRef}
      className="h-16 flex items-center justify-between px-4 md:px-6 border-b font-lufga"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onSidebarToggle}
          className="p-2 rounded-xl transition-colors md:hidden"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          {sidebarOpen ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineBars3CenterLeft className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title || 'Dashboard'}
          </h1>
          {subtitle && (
            <p className="text-[11px] md:text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <HiOutlineBell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 outline outline-2" style={{ outlineColor: 'var(--bg-secondary)' }} />
        </button>

        <div className="h-8 w-px mx-1 md:mx-2" style={{ backgroundColor: 'var(--border-primary)' }} />

        {user && (
          <div className="flex items-center gap-2 md:gap-3 pl-0 md:pl-1">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-xs md:text-sm font-black shrink-0"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
