'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { invoicesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { HiOutlinePlus, HiOutlineDocumentText, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineFunnel, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineTrash } from 'react-icons/hi2';

const paymentBadge = {
  paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Paid' },
  part_payment: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500', label: 'Part Payment' },
  unpaid: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400', label: 'Unpaid' },
};

const typeBadge = {
  cash_sales: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'Cash Sales' },
  proforma: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Proforma' },
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ type: '', status: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchDelayRef = useRef(null);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'administrator';
  const isStorekeeper = user?.role === 'storekeeper';

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const cardRef = useRef(null);
  const rowsRef = useRef(null);
  const animRan = useRef(false);

  useEffect(() => { loadInvoices(); }, [page, filter]);

  useEffect(() => {
    if (searchDelayRef.current) clearTimeout(searchDelayRef.current);
    searchDelayRef.current = setTimeout(() => {
      setFilter(f => ({ ...f, search: searchInput }));
      setPage(1);
    }, 400);
    return () => { if (searchDelayRef.current) clearTimeout(searchDelayRef.current); };
  }, [searchInput]);

  useEffect(() => {
    if (animRan.current) return;
    animRan.current = true;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(headerRef.current, { y: -20, opacity: 0, duration: 0.4 });
      tl.from(cardRef.current, { y: 20, opacity: 0, duration: 0.35 }, '-=0.1');
    }, containerRef);
    return () => ctx.revert();
  }, []);



  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
      if (filter.search) params.search = filter.search;
      const res = await invoicesAPI.list(params);
      setInvoices(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await invoicesAPI.delete(deleteTarget._id);
      toast.success(`Invoice ${deleteTarget.invoiceCode} deleted.`);
      setDeleteTarget(null);
      setInvoices((prev) => prev.filter((inv) => inv._id !== deleteTarget._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice.');
    } finally {
      setDeleting(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    boxShadow: 'var(--shadow-lg)',
  };

  return (
    <div ref={containerRef} className="font-lufga">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Invoices</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {pagination ? `${pagination.total} invoice${pagination.total !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
        {!isStorekeeper && (
          <button onClick={() => router.push('/invoices/new')}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-ngv-700 hover:bg-ngv-800 transition-colors shadow-sm">
            <HiOutlinePlus className="w-4 h-4" />
            New Invoice
          </button>
        )}
      </div>

      {/* Card */}
      <div ref={cardRef} className="rounded-3xl" style={cardStyle}>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by invoice code or customer name..."
              className="w-full h-9 pl-9 pr-8 rounded-lg text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
              }}
              onFocus={(e) => e.target.style.borderColor = '#166534'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'} />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setFilter(f => ({ ...f, search: '' })); }}
                className="absolute right-2 top-1/2 -translate-y-1/2">
                <HiOutlineXMark className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <HiOutlineFunnel className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <select value={filter.type}
              onChange={(e) => { setFilter(f => ({ ...f, type: e.target.value })); setPage(1); }}
              className="h-9 px-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
              }}>
              <option value="">All Types</option>
              <option value="cash_sales">Cash Sales</option>
              <option value="proforma">Proforma</option>
            </select>
            <select value={filter.status}
              onChange={(e) => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="h-9 px-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
              }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="paid">Paid</option>
              <option value="part_payment">Part Payment</option>
              <option value="unpaid">Unpaid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 mx-auto rounded-full animate-spin" style={{ borderColor: 'var(--border-secondary)', borderTopColor: '#166534' }} />
            <p className="text-sm mt-3 font-medium" style={{ color: 'var(--text-muted)' }}>Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <HiOutlineDocumentText className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No invoices found</p>
            {!isStorekeeper && (
              <button onClick={() => router.push('/invoices/new')}
                className="mt-3 text-sm font-semibold transition-colors"
                style={{ color: '#166534' }}>
                Create your first invoice
              </button>
            )}
          </div>
        ) : (
          <div ref={rowsRef} className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
            {invoices.map((inv) => {
              const typeB = typeBadge[inv.type] || typeBadge.proforma;
              const payB = paymentBadge[inv.paymentStatus] || paymentBadge.unpaid;
              return (
                <div key={inv._id}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ backgroundColor: 'transparent' }}
                  onClick={() => router.push(`/invoices/${inv._id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  {/* Mobile card layout */}
                  <div className="sm:hidden px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black tracking-tight" style={{ color: '#166534' }}>{inv.invoiceCode}</span>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${typeB.bg} ${typeB.text}`}>{typeB.label}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${payB.bg} ${payB.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${payB.dot}`} />
                          {payB.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {inv.customerSnapshot?.name || inv.billTo || 'Walk-in'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>₦{inv.grandTotal?.toLocaleString()}</span>
                        {inv.type === 'cash_sales' && (
                          <span className="text-[10px] font-semibold" style={{ color: inv.balanceDue > 0 ? '#ef4444' : '#166534' }}>
                            {inv.balanceDue > 0 ? `${inv.balanceDue.toLocaleString()} due` : 'Paid'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end -mt-0.5">
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(inv); }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: '#ef4444' }}>
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Desktop row layout */}
                  <div className="hidden sm:flex sm:items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black tracking-tight" style={{ color: '#166534' }}>{inv.invoiceCode}</span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 ${typeB.bg} ${typeB.text}`}>{typeB.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{inv.customerSnapshot?.name || inv.billTo || 'Walk-in'}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{inv.createdBy?.name || ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>₦{inv.grandTotal?.toLocaleString()}</p>
                        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                          {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold" style={{ color: inv.balanceDue > 0 ? '#ef4444' : '#166534' }}>
                          {inv.balanceDue > 0 ? `₦${inv.balanceDue.toLocaleString()} due` : 'Settled'}
                        </p>
                        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Paid: ₦{inv.amountPaid?.toLocaleString()}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${payB.bg} ${payB.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${payB.dot}`} />
                        {payB.label}
                      </div>
                      {isAdmin && (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(inv); }}
                          className="p-2 rounded-xl transition-all duration-200 hover:bg-red-50 shrink-0"
                          style={{ color: '#ef4444' }} title="Delete invoice">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination footer */}
        {pagination && pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between px-4 sm:px-6 py-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { if (!(pagination.page <= 1)) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {pagination.page} / {pagination.pages}
              </span>
              <button onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { if (!(pagination.page >= pagination.pages)) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <HiOutlineTrash className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-center mb-1" style={{ color: 'var(--text-primary)' }}>Delete Invoice</h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              Permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.invoiceCode}</strong>?
              <br />This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
