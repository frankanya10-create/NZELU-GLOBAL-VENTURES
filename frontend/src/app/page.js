'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ngv_token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        const roleMap = { administrator: '/admin/dashboard', manager: '/manager/dashboard', cashier: '/cashier/dashboard', storekeeper: '/storekeeper/dashboard' };
        router.replace(roleMap[role] || '/admin/dashboard');
      } catch {
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: 'var(--border-secondary)', borderTopColor: '#166534' }} />
    </div>
  );
}
