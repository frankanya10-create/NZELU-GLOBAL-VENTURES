'use client';
import useAuthStore from '@/store/authStore';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'manager') return null;
  return <DashboardContent />;
}
