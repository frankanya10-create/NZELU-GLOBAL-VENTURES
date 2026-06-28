'use client';
import { useState, useEffect, useRef } from 'react';
import { dashboardAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import {
  HiOutlineCurrencyDollar, HiOutlineCube,
  HiOutlineUsers, HiOutlineDocumentText, HiOutlineClock,
  HiOutlineArrowTrendingUp, HiOutlineExclamationTriangle,
  HiOutlineArrowRight, HiOutlineTruck, HiOutlineArrowUpRight,
} from 'react-icons/hi2';

const allStatCards = [
  { key: 'todaySales', label: "Today's Sales", icon: HiOutlineCurrencyDollar, color: '#166534', prefix: '₦', href: '/invoices' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: HiOutlineArrowTrendingUp, color: '#2563eb', prefix: '₦', href: '/invoices' },
  { key: 'totalInvoices', label: 'Total Invoices', icon: HiOutlineDocumentText, color: '#7c3aed', suffix: '', href: '/invoices' },
  { key: 'totalProducts', label: 'Products', icon: HiOutlineCube, color: '#d97706', suffix: '', href: '/products' },
  { key: 'totalCustomers', label: 'Customers', icon: HiOutlineUsers, color: '#0d9488', suffix: '', href: '/customers' },
  { key: 'activeRolls', label: 'Active Rolls', icon: HiOutlineTruck, color: '#6366f1', suffix: '', href: '/products' },
  { key: 'pendingInvoices', label: 'Pending / Unpaid', icon: HiOutlineClock, color: '#e11d48', suffix: '', href: '/invoices' },
  { key: 'lowStockProducts', label: 'Low Stock Alerts', icon: HiOutlineExclamationTriangle, color: '#dc2626', suffix: '', href: '/products' },
];

const roleStatMap = {
  administrator: allStatCards,
  manager: allStatCards,
  cashier: allStatCards.filter(s => ['todaySales', 'monthlySales', 'totalInvoices', 'pendingInvoices', 'totalCustomers'].includes(s.key)),
  storekeeper: allStatCards.filter(s => ['totalProducts', 'activeRolls', 'lowStockProducts'].includes(s.key)),
};

export default function DashboardContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore((s) => s.user);
  const statRefs = useRef([]);
  const headerRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setError(null);
    try {
      const res = await dashboardAPI.summary();
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = roleStatMap[user?.role] || allStatCards;

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (error) {
    return (
      <div className="font-lufga flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <HiOutlineExclamationTriangle className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Could not load dashboard</p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={loadData}
          className="h-10 px-5 rounded-xl text-sm font-semibold text-white bg-ngv-700 hover:bg-ngv-800 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="font-lufga">
      {/* Welcome */}
      <div ref={headerRef} className="mb-8">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          <span className="mx-2">·</span>
          <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{user?.role}</span>
        </p>
      </div>

      {/* Stat Cards - No GSAP animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const value = data[card.key] ?? 0;
          const formatted = card.prefix
            ? `${card.prefix}${Number(value).toLocaleString()}`
            : Number(value).toLocaleString();

          const Card = (
            <div ref={(el) => statRefs.current[i] = el}
              className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
              }}>
              {/* View icon */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 translate-x-1.5"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <HiOutlineArrowUpRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </div>
              {/* Icon */}
              <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                }}>
                <Icon className="w-5 h-5 relative" style={{ color: 'var(--text-secondary)' }} />
              </div>
              {/* Label */}
              <p className="relative text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                {card.label}
              </p>
              {/* Value */}
              <p className="relative text-3xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                {formatted}
              </p>
            </div>
          );

          return card.href ? (
            <Link key={card.key} href={card.href} className="block">{Card}</Link>
          ) : (
            <div key={card.key}>{Card}</div>
          );
        })}
      </div>

      {/* Recent Invoices + Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="rounded-3xl overflow-hidden" style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>RECENT INVOICES</h3>
            <Link href="/invoices" className="text-xs font-bold flex items-center gap-1 transition-colors hover:gap-1.5"
              style={{ color: '#166534' }}>
              View All <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {data.recentInvoices?.length > 0 ? (
              <div className="space-y-1">
                {data.recentInvoices.slice(0, 5).map((inv) => (
                  <Link key={inv._id} href={`/invoices/${inv._id}`}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{inv.invoiceCode}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {inv.customerSnapshot?.name || inv.billTo || 'Walk-in Customer'}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-black">₦{inv.grandTotal?.toLocaleString()}</p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                        inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.paymentStatus === 'part_payment' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {inv.paymentStatus?.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No recent invoices</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-3xl overflow-hidden" style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>TOP PRODUCTS</h3>
          </div>
          <div className="p-4">
            {data.topProducts?.length > 0 ? (
              <div className="space-y-1">
                {data.topProducts.map((p, i) => (
                  <div key={p._id}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{p.name || 'Unknown Product'}</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{p.sku || ''} · Qty: {p.totalQty || 0} {p.unit || 'pcs'}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black shrink-0 ml-3" style={{ color: 'var(--text-primary)' }}>
                      ₦{(p.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No product sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
