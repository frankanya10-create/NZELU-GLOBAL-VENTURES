'use client';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import useAuthStore from '@/store/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  HiOutlineHome, HiOutlineShoppingCart, HiOutlineCube,
  HiOutlineUsers, HiOutlineArrowLeftOnRectangle,
  HiOutlineTruck, HiOutlineWrench, HiOutlineArrowTrendingUp,
  HiOutlineBanknotes, HiOutlineBars3CenterLeft,
  HiOutlineDocumentText, HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth, HiOutlineXMark,
} from 'react-icons/hi2';

const segments = {
  administrator: [
    {
      label: 'Main',
      links: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineHome },
        { href: '/admin/manage-staff', label: 'Staff', icon: HiOutlineCog6Tooth },
      ],
    },
    {
      label: 'Sales',
      links: [
        { href: '/invoices', label: 'Invoices', icon: HiOutlineDocumentText },
        { href: '/customers', label: 'Customers', icon: HiOutlineUsers },
      ],
    },
    {
      label: 'Operations',
      links: [
        { href: '/products', label: 'Products', icon: HiOutlineCube },
        { href: '/branches', label: 'Branches', icon: HiOutlineBars3CenterLeft },
        { href: '/transfers', label: 'Transfers', icon: HiOutlineArrowTrendingUp },
        { href: '/expenses', label: 'Expenses', icon: HiOutlineBanknotes },
      ],
    },
    {
      label: 'Field',
      links: [
        { href: '/installations', label: 'Installations', icon: HiOutlineWrench },
        { href: '/deliveries', label: 'Deliveries', icon: HiOutlineTruck },
      ],
    },
    {
      label: 'Insights',
      links: [
        { href: '/reports', label: 'Reports', icon: HiOutlineDocumentChartBar },
        { href: '/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
      ],
    },
  ],
  manager: [
    {
      label: 'Main',
      links: [
        { href: '/manager/dashboard', label: 'Dashboard', icon: HiOutlineHome },
      ],
    },
    {
      label: 'Sales',
      links: [
        { href: '/invoices', label: 'Invoices', icon: HiOutlineDocumentText },
        { href: '/customers', label: 'Customers', icon: HiOutlineUsers },
      ],
    },
    {
      label: 'Operations',
      links: [
        { href: '/products', label: 'Products', icon: HiOutlineCube },
        { href: '/transfers', label: 'Transfers', icon: HiOutlineArrowTrendingUp },
      ],
    },
    {
      label: 'Field',
      links: [
        { href: '/installations', label: 'Installations', icon: HiOutlineWrench },
        { href: '/deliveries', label: 'Deliveries', icon: HiOutlineTruck },
      ],
    },
    {
      label: 'Insights',
      links: [
        { href: '/reports', label: 'Reports', icon: HiOutlineDocumentChartBar },
        { href: '/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
      ],
    },
  ],
  cashier: [
    {
      label: 'Main',
      links: [
        { href: '/cashier/dashboard', label: 'Dashboard', icon: HiOutlineHome },
      ],
    },
    {
      label: 'Sales',
      links: [
        { href: '/invoices', label: 'Invoices', icon: HiOutlineDocumentText },
        { href: '/invoices/new', label: 'New Invoice', icon: HiOutlineShoppingCart },
        { href: '/customers', label: 'Customers', icon: HiOutlineUsers },
      ],
    },
    {
      label: 'System',
      links: [
        { href: '/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
      ],
    },
  ],
  storekeeper: [
    {
      label: 'Main',
      links: [
        { href: '/storekeeper/dashboard', label: 'Dashboard', icon: HiOutlineHome },
      ],
    },
    {
      label: 'Inventory',
      links: [
        { href: '/products', label: 'Products', icon: HiOutlineCube },
        { href: '/transfers', label: 'Transfers', icon: HiOutlineArrowTrendingUp },
      ],
    },
    {
      label: 'Field',
      links: [
        { href: '/deliveries', label: 'Deliveries', icon: HiOutlineTruck },
      ],
    },
    {
      label: 'System',
      links: [
        { href: '/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
      ],
    },
  ],
};

export default function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  const sidebarRef = useRef(null);
  const linkRefs = useRef([]);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const role = user?.role || 'cashier';
  const groups = segments[role] || segments.cashier;

  let linkIndex = 0;

  useEffect(() => {
    if (isMobile) {
      gsap.to(sidebarRef.current, {
        x: isOpen ? 0 : -320,
        duration: 0.35,
        ease: 'power3.inOut',
      });
    } else if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: isOpen ? 280 : 80,
        duration: 0.4,
        ease: 'power3.inOut',
      });
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    const items = linkRefs.current.filter(Boolean);
    if (items.length) {
      gsap.set(items, { opacity: 0, y: 6 });
      gsap.to(items, {
        opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out',
        clearProps: 'opacity,transform',
      });
    }
  }, [isOpen, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    logout();
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleNavClick = () => {
    if (isMobile) onToggle();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        ref={sidebarRef}
        className="font-lufga fixed left-0 top-0 h-screen z-50 flex flex-col overflow-hidden"
        style={{
          width: 280,
          backgroundColor: 'var(--bg-secondary)',
          borderRight: isMobile ? 'none' : '1px solid var(--border-primary)',
          transform: isMobile && !isOpen ? 'translateX(-320px)' : 'translateX(0)',
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center h-16 px-4 border-b shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <Link href="/dashboard" onClick={handleNavClick} className="flex items-center gap-2.5">
                <img src="/logo.png" alt="NGV Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                <div>
                  <span className="text-sm font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>NGV</span>
                  <span className="text-[10px] font-medium ml-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>ERP</span>
                </div>
              </Link>
              <button onClick={onToggle} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                {isMobile ? <HiOutlineXMark className="w-4 h-4" /> : <HiOutlineBars3CenterLeft className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button onClick={onToggle} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <HiOutlineBars3CenterLeft className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto scrollbar-hide space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              {isOpen && (
                <p className="px-4 mb-1 text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                  {group.label}
                </p>
              )}
              {group.links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                const Icon = link.icon;
                const idx = linkIndex++;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleNavClick}
                    ref={(el) => linkRefs.current[idx] = el}
                    className={`flex items-center ${isOpen ? 'gap-3 px-4' : 'justify-center'} h-10 rounded-xl transition-all duration-200 shrink-0`}
                    style={{
                      backgroundColor: isActive ? 'var(--ngv-active-bg)' : 'transparent',
                      color: isActive ? 'var(--ngv-active-text)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
                    title={!isOpen ? link.label : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {isOpen && <span className="text-xs font-medium tracking-wide truncate">{link.label.toUpperCase()}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="px-3 py-2">
            <ThemeToggle collapsed={!isOpen || isMobile} />
          </div>

          <div className="px-3 pb-3">
            {isOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-medium shrink-0" style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                  <p className="text-[10px] font-semibold tracking-wide uppercase opacity-50" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
                </div>
                <button onClick={handleLogout}
                  className="p-2 rounded-lg transition-all duration-200 shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Logout">
                  <HiOutlineArrowLeftOnRectangle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-medium" style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                }}>
                  {initials}
                </div>
                <button onClick={handleLogout}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Logout">
                  <HiOutlineArrowLeftOnRectangle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
