'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function DashboardRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role) {
      const map = {
        administrator: '/admin/dashboard',
        manager: '/manager/dashboard',
        cashier: '/cashier/dashboard',
        storekeeper: '/storekeeper/dashboard',
      };
      router.replace(map[user.role] || '/admin/dashboard');
    }
  }, [user]);

  return null;
}
