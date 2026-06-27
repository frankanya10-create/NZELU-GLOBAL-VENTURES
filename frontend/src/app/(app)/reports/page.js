'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { reportsAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { HiOutlineDocumentArrowDown } from 'react-icons/hi2';

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'administrator';
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 15 }, {
        opacity: 1, y: 0, duration: 0.35, ease: 'power2.out',
      });
    }
  }, [tab]);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'daily': res = await reportsAPI.dailySales({}); break;
        case 'monthly': res = await reportsAPI.monthlySales({}); break;
        case 'pnl': res = await reportsAPI.pnl({}); break;
        case 'valuation': res = await reportsAPI.stockValuation(); break;
        case 'ageing': res = await reportsAPI.ageing(); break;
        case 'cutting': res = await reportsAPI.cuttingHistory({}); break;
        default: res = { data: { data: [] } };
      }
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load report.');
      setData(null);
    } finally { setLoading(false); }
  };

  const tabs = [
    { key: 'daily', label: 'Daily Sales', adminOnly: false },
    { key: 'monthly', label: 'Monthly Sales', adminOnly: false },
    { key: 'pnl', label: 'P&L Statement', adminOnly: true },
    { key: 'valuation', label: 'Stock Valuation', adminOnly: false },
    { key: 'ageing', label: 'Debt Ageing', adminOnly: false },
    { key: 'cutting', label: 'Cutting History', adminOnly: false },
  ].filter(t => !t.adminOnly || isAdmin);

  return (
    <div ref={containerRef}>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-ngv-700 text-white' : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Loading report..." /> : (
        <div className="ngv-card">
          <div className="p-6">
            {tab === 'daily' && data?.data?.sales && (
              <DailySalesView data={data.data} />
            )}
            {tab === 'monthly' && data?.data && (
              <MonthlySalesView data={data.data} />
            )}
            {tab === 'pnl' && data?.data && (
              <PnLView data={data.data} />
            )}
            {tab === 'valuation' && data?.data && (
              <ValuationView data={data.data} />
            )}
            {tab === 'ageing' && data?.data && (
              <AgeingView data={data.data} />
            )}
            {tab === 'cutting' && data?.data && (
              <CuttingView data={data} />
            )}
            {!data && <p className="text-surface-500 text-center py-8">No data available for this report.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function DailySalesView({ data }) {
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-ngv-50 rounded-xl"><p className="text-sm text-surface-600">Total Sales</p><p className="text-xl font-bold text-ngv-800">₦{data.summary?.grandTotal?.toLocaleString() || '0'}</p></div>
        <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-surface-600">Total Paid</p><p className="text-xl font-bold text-blue-800">₦{data.summary?.totalPaid?.toLocaleString() || '0'}</p></div>
        <div className="p-4 bg-amber-50 rounded-xl"><p className="text-sm text-surface-600">Discount</p><p className="text-xl font-bold text-amber-800">₦{data.summary?.totalDiscount?.toLocaleString() || '0'}</p></div>
        <div className="p-4 bg-purple-50 rounded-xl"><p className="text-sm text-surface-600">Invoices</p><p className="text-xl font-bold text-purple-800">{data.summary?.count || 0}</p></div>
      </div>
      <table className="ngv-table">
        <thead><tr><th>Date</th><th>Sales</th><th>Discount</th><th>VAT</th><th>Count</th></tr></thead>
        <tbody>
          {data.sales?.map((s, i) => (
            <tr key={i}>
              <td>{s._id}</td>
              <td>₦{s.totalSales?.toLocaleString()}</td>
              <td>₦{s.totalDiscount?.toLocaleString()}</td>
              <td>₦{s.totalVat?.toLocaleString()}</td>
              <td>{s.count}</td>
            </tr>
          )) || <tr><td colSpan={5} className="text-center text-surface-500 py-8">No data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MonthlySalesView({ data }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (
    <table className="ngv-table">
      <thead><tr><th>Month</th><th>Total Sales</th><th>Count</th></tr></thead>
      <tbody>
        {data.map((s, i) => (
          <tr key={i}>
            <td className="font-medium">{months[s._id - 1]}</td>
            <td>₦{s.totalSales?.toLocaleString()}</td>
            <td>{s.count}</td>
          </tr>
        )) || <tr><td colSpan={3} className="text-center text-surface-500 py-8">No data</td></tr>}
      </tbody>
    </table>
  );
}

function PnLView({ data }) {
  return (
    <div className="max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-center mb-6">Profit & Loss Statement</h3>
      <div className="space-y-3">
        <div className="flex justify-between p-3 bg-ngv-50 rounded-xl"><span className="font-medium">Revenue</span><span className="font-bold text-ngv-800">₦{data.revenue?.toLocaleString()}</span></div>
        <div className="flex justify-between p-3 bg-red-50 rounded-xl"><span className="font-medium">Expenses</span><span className="font-bold text-red-700">₦{data.expenses?.toLocaleString()}</span></div>
        <div className="border-t border-surface-200 pt-3 flex justify-between p-3 bg-blue-50 rounded-xl"><span className="font-medium text-lg">Net Profit</span><span className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-ngv-800' : 'text-red-700'}`}>₦{data.netProfit?.toLocaleString()}</span></div>
        <div className="flex justify-between p-3"><span className="text-surface-600">Expense Ratio</span><span>{data.expenseRatio}%</span></div>
        <p className="text-center text-sm text-surface-500 mt-2">Period: {data.period}</p>
      </div>
    </div>
  );
}

function ValuationView({ data }) {
  return (
    <div className="max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-center mb-6">Stock Valuation</h3>
      <div className="space-y-3">
        <div className="flex justify-between p-3 bg-ngv-50 rounded-xl"><span>Product Stock Value</span><span className="font-bold">₦{(data.totalStockValue || 0).toLocaleString()}</span></div>
        <div className="flex justify-between p-3 bg-blue-50 rounded-xl"><span>Roll Stock Value</span><span className="font-bold">₦{(data.totalRollValue || 0).toLocaleString()}</span></div>
        <div className="border-t pt-3 flex justify-between p-3 bg-amber-50 rounded-xl"><span className="font-bold text-lg">Combined Value</span><span className="font-bold text-lg">₦{(data.combinedValue || 0).toLocaleString()}</span></div>
        <div className="flex justify-between p-3"><span className="text-surface-600">Total Products</span><span>{data.totalProducts}</span></div>
        <div className="flex justify-between p-3"><span className="text-surface-600">Active Rolls</span><span>{data.totalRolls}</span></div>
      </div>
      {data.lowStockItems?.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-red-700 mb-2">Low Stock Alerts</h4>
          {data.lowStockItems.map(p => (
            <div key={p._id} className="flex justify-between p-2 bg-red-50 rounded-lg mb-1 text-sm">
              <span>{p.name}</span>
              <span className="font-semibold">{p.stock} {p.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgeingView({ data }) {
  const ranges = ['0-30', '31-60', '61-90', '90+'];
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Customer Debt Ageing Analysis</h3>
      {ranges.map(range => (
        <div key={range} className="mb-4">
          <div className="flex justify-between p-3 bg-surface-50 rounded-t-xl font-medium">
            <span>{range} Days</span>
            <span>₦{(data[range]?.total || 0).toLocaleString()}</span>
          </div>
          {data[range]?.customers?.length > 0 ? (
            <div className="border-x border-b border-surface-100 rounded-b-xl">
              {data[range].customers.map((c, i) => (
                <div key={i} className="flex justify-between px-4 py-2 text-sm">
                  <span>{c.name}</span>
                  <span className="font-medium">₦{c.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-2 text-sm text-surface-500 border-x border-b border-surface-100 rounded-b-xl">No customers in this range</p>
          )}
        </div>
      ))}
    </div>
  );
}

function CuttingView({ data }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Roll Cutting History</h3>
      <table className="ngv-table">
        <thead><tr><th>Date</th><th>Roll ID</th><th>Product</th><th>Invoice</th><th>Cut (m)</th><th>Before</th><th>After</th><th>By</th></tr></thead>
        <tbody>
          {data?.data?.length > 0 ? data.data.map((c, i) => (
            <tr key={c._id || i}>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              <td className="font-mono">{c.rollId}</td>
              <td>{c.product?.name || '-'}</td>
              <td className="font-mono text-xs">{c.invoiceCode}</td>
              <td className="font-medium">{c.cutLength}</td>
              <td>{c.remainingBefore}</td>
              <td>{c.remainingAfter}</td>
              <td>{c.cutBy?.name || '-'}</td>
            </tr>
          )) : <tr><td colSpan={8} className="text-center text-surface-500 py-8">No cutting history</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
