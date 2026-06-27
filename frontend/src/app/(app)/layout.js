'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import PageTransition from '@/components/layout/PageTransition';
import useAuthStore from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const titles = {
  '/admin/dashboard': { title: 'Admin Dashboard', subtitle: 'Full system oversight' },
  '/manager/dashboard': { title: 'Manager Dashboard', subtitle: 'Branch & stock overview' },
  '/cashier/dashboard': { title: 'Dashboard', subtitle: 'Your sales at a glance' },
  '/storekeeper/dashboard': { title: 'Dashboard', subtitle: 'Warehouse & inventory overview' },
  '/invoices': { title: 'Invoices', subtitle: 'Manage sales and proforma invoices' },
  '/invoices/new': { title: 'New Invoice', subtitle: 'Create a new sales document' },
  '/products': { title: 'Products & Inventory', subtitle: 'Manage your product catalog' },
  '/customers': { title: 'Customers', subtitle: 'View and manage customer relationships' },
  '/users': { title: 'User Management', subtitle: 'Administer system users' },
  '/branches': { title: 'Branches', subtitle: 'Manage branch locations' },
  '/transfers': { title: 'Stock Transfers', subtitle: 'Manage inter-branch transfers' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Business intelligence and insights' },
  '/expenses': { title: 'Expenses', subtitle: 'Track overhead costs' },
  '/installations': { title: 'Installations', subtitle: 'Field operations management' },
  '/deliveries': { title: 'Deliveries & Logistics', subtitle: 'Track driver dispatch and delivery' },
  '/admin/manage-staff': { title: 'Staff Management', subtitle: 'Manage system users and roles' },
  '/admin/manage-staff/add': { title: 'Add Staff', subtitle: 'Create a new staff account' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account and security' },
};

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const initRan = useRef(false);

  useEffect(() => {
    if (!initRan.current) {
      initRan.current = true;
      initialize();
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        fetch('/api/auth/check-inactivity', { method: 'POST', credentials: 'include' }).catch(() => {});
      }
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, handleActivity));
    const timer = setInterval(handleActivity, 300000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearInterval(timer);
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: 'var(--border-secondary)', borderTopColor: '#166534' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading NGV ERP...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pageInfo = Object.entries(titles).find(([path]) =>
    pathname === path || (path.endsWith('/new') && pathname.includes('/invoices/new'))
  );

  const headerTitle = pageInfo ? pageInfo[1].title : 'Dashboard';
  const headerSubtitle = pageInfo ? pageInfo[1].subtitle : '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="no-print">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-[280px]' : 'md:ml-[80px]'}`}>
        <div className="no-print">
          <Header title={headerTitle} subtitle={headerSubtitle} sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        <main className="flex-1 p-6">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
