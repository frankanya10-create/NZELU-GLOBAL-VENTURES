'use client';
import useAuthStore from '@/store/authStore';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'administrator') return null;
  return <DashboardContent />;
}
