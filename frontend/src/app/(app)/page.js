'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function AppHome() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const getRoleRedirect = useAuthStore((s) => s.getRoleRedirect);

  useEffect(() => {
    if (user?.role) {
      router.replace(getRoleRedirect());
    } else {
      router.replace('/login');
    }
  }, [user]);

  return null;
}
