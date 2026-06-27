'use client';
import useAuthStore from '@/store/authStore';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function StorekeeperDashboard() {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'storekeeper') return null;
  return <DashboardContent />;
}
