'use client';
import useAuthStore from '@/store/authStore';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function CashierDashboard() {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'cashier') return null;
  return <DashboardContent />;
}
