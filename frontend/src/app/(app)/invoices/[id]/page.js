'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { invoicesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import StandardSalesInvoicePrint from '@/components/invoice/StandardSalesInvoicePrint';
import ProformaInvoicePrint from '@/components/invoice/ProformaInvoicePrint';
import {
  HiOutlineArrowLeft, HiOutlinePrinter, HiOutlineTrash,
  HiOutlineCheckCircle, HiOutlineDocumentText, HiOutlineCurrencyDollar,
  HiOutlineCheck, HiOutlinePencilSquare,
} from 'react-icons/hi2';

const statusBadge = {
  converted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500', label: 'Converted' },
  paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Paid' },
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400', label: 'Draft' },
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500', label: 'Pending' },
  part_payment: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500', label: 'Part Payment' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', dot: 'bg-red-500', label: 'Cancelled' },
};

const paymentBadge = {
  paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Paid' },
  part_payment: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500', label: 'Part Payment' },
  unpaid: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400', label: 'Unpaid' },
};

const typeBadge = {
  cash_sales: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'Cash Sales' },
  proforma: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Proforma' },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [commitAmount, setCommitAmount] = useState('');
  const [commitIsSupplied, setCommitIsSupplied] = useState(true);
  const [convertPaymentStatus, setConvertPaymentStatus] = useState('paid');
  const [convertIsSupplied, setConvertIsSupplied] = useState(true);
  const [convertAmountPaid, setConvertAmountPaid] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  useEffect(() => {
    if (invoice && containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.4, ease: 'power3.out',
      });
    }
  }, [invoice]);

  const loadInvoice = async () => {
    try {
      const res = await invoicesAPI.get(params.id);
      setInvoice(res.data.data);
      setCommitAmount(res.data.data.grandTotal);
    } catch {
      toast.error('Invoice not found.');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await invoicesAPI.delete(params.id);
      toast.success('Invoice deleted.');
      router.push('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice.');
    }
    setShowDeleteModal(false);
  };

  const handleCommit = async () => {
    try {
      const payload = { amountPaid: parseFloat(commitAmount) || 0 };
      if (!invoice.isSupplied) payload.isSupplied = commitIsSupplied;
      await invoicesAPI.commit(params.id, payload);
      toast.success('Invoice committed successfully!');
      loadInvoice();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to commit invoice.');
    }
    setShowCommitModal(false);
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const payload = { paymentStatus: convertPaymentStatus, isSupplied: convertIsSupplied };
      if (convertPaymentStatus === 'part_payment') {
        payload.amountPaid = parseFloat(convertAmountPaid) || 0;
      }
      const res = await invoicesAPI.convert(params.id, payload);
      toast.success('Proforma converted to Sales Invoice!');
      setShowConvertModal(false);
      router.push('/invoices/' + res.data.data.salesInvoice._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert invoice.');
      setConverting(false);
      setShowConvertModal(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <LoadingSpinner text="Loading invoice..." />;
  if (!invoice) return null;

  const isAdmin = user?.role === 'administrator';
  const isCashier = user?.role === 'cashier';
  const payB = paymentBadge[invoice.paymentStatus] || paymentBadge.unpaid;
  const statB = statusBadge[invoice.status] || null;

  const showStatB = statB && ['converted', 'draft', 'cancelled'].includes(invoice.status);
  const typeB = typeBadge[invoice.type] || typeBadge.proforma;

  const cardClass = 'rounded-3xl overflow-hidden';
  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    boxShadow: 'var(--shadow-lg)',
  };

  return (
    <>
      <style>{`
        .print-template-container { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-template-container { display: block !important; }
        }
      `}</style>

      {/* ── SCREEN VIEW ── */}
      <div ref={containerRef} className="font-lufga no-print">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/invoices')}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors group"
              style={{ color: 'var(--text-muted)' }}>
              <HiOutlineArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to invoices
            </button>
            <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-primary)' }} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {invoice.invoiceCode}
                </h1>
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold ${typeB.bg} ${typeB.text}`}>
                  {typeB.label}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Created {new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onClick={() => router.push(`/invoices/new?edit=${invoice._id}`)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex-1 sm:flex-none"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ngv-active-bg)'; e.currentTarget.style.color = 'var(--ngv-active-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <HiOutlinePencilSquare className="w-4 h-4 shrink-0" />
              Edit
            </button>
            <button onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex-1 sm:flex-none"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ngv-active-bg)'; e.currentTarget.style.color = 'var(--ngv-active-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <HiOutlinePrinter className="w-4 h-4 shrink-0" />
              Print
            </button>
            {invoice.type === 'cash_sales' && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button onClick={() => { setShowCommitModal(true); setCommitAmount(''); setCommitIsSupplied(true); }}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 flex-1 sm:flex-none"
                style={{ backgroundColor: 'var(--ngv-active-bg)' }}>
                <HiOutlineCheckCircle className="w-4 h-4 shrink-0" />
                Commit
              </button>
            )}
            {invoice.type === 'proforma' && invoice.status !== 'converted' && invoice.status !== 'cancelled' && (
              <button onClick={() => { setShowConvertModal(true); setConvertPaymentStatus('paid'); setConvertIsSupplied(true); setConvertAmountPaid(''); }}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 flex-1 sm:flex-none"
                style={{ backgroundColor: '#166534' }}>
                <HiOutlineCurrencyDollar className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Convert</span>
                <span className="hidden sm:inline">Convert to Sales Invoice</span>
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex-1 sm:flex-none"
                style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
                <HiOutlineTrash className="w-4 h-4 shrink-0" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Invoice detail card */}
        <div className={cardClass} style={cardStyle}>
          {/* Header section */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-primary)' }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <img src="/logo.png" alt="NGV Logo" className="w-10 h-10 rounded-xl object-cover" />
                  <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Nzelu Global Ventures</h2>
                </div>
                <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                  Tarpaulins, Carpets, Centre Rugs, Artificial Grass &amp; Tent Installations
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Head Office: 234 Agege Motor Road, Mushin, Lagos<br />
                  Branch: 185 Dopemu Road, Agege, Lagos (Greater Path Mall)<br />
                  Email: nzeluglobalventures@gmail.com
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-black tracking-tight" style={{ color: '#166534' }}>{invoice.invoiceCode}</p>
                <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                  Date: {new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {invoice.validityDate && (
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Valid Until: {new Date(invoice.validityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold mt-2 ${payB.bg} ${payB.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${payB.dot}`} />
                  {payB.label}
                </span>
                {showStatB && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold mt-1 ${statB.bg} ${statB.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statB.dot}`} />
                    {statB.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Bill To</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{invoice.customerSnapshot?.name || invoice.billTo || 'Walk-in Customer'}</p>
            {invoice.customerSnapshot?.telephone && (
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{invoice.customerSnapshot.telephone}</p>
            )}
            {invoice.customerSnapshot?.address && (
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{invoice.customerSnapshot.address}</p>
            )}
            {invoice.status === 'converted' && invoice.convertedTo && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Converted</span>
                <button onClick={() => router.push(`/invoices/${invoice.convertedTo}`)}
                  className="text-xs font-bold underline transition-colors"
                  style={{ color: '#166534' }}>
                  View Sales Invoice →
                </button>
              </div>
            )}
            {invoice.convertedFrom && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">From Proforma</span>
                <button onClick={() => router.push(`/invoices/${invoice.convertedFrom}`)}
                  className="text-xs font-bold underline transition-colors"
                  style={{ color: '#166534' }}>
                  View Proforma →
                </button>
              </div>
            )}
          </div>

          {/* Line items table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ width: 48, padding: '10px 16px', textAlign: 'center', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>#</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Description</th>
                  <th style={{ width: 80, padding: '10px 16px', textAlign: 'center', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Qty</th>
                  <th style={{ width: 120, padding: '10px 16px', textAlign: 'right', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Unit Price</th>
                  <th style={{ width: 120, padding: '10px 16px', textAlign: 'right', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-primary)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.description}</span>
                      {item.rollId && <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Roll: {item.rollId}</span>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--text-primary)' }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--text-primary)' }}>₦{item.unitPrice?.toLocaleString()}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>₦{item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ padding: '16px 28px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-primary)' }}>
            <div style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₦{invoice.subtotal?.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                  <span style={{ color: '#dc2626' }}>Discount {invoice.discountReason ? `(${invoice.discountReason})` : ''}</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>-₦{invoice.discount?.toLocaleString()}</span>
                </div>
              )}
              <div style={{ height: 1, backgroundColor: 'var(--border-primary)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 16, fontWeight: 900 }}>
                <span style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                <span style={{ color: '#166534' }}>₦{invoice.grandTotal?.toLocaleString()}</span>
              </div>
              {invoice.type === 'cash_sales' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13, marginTop: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
                    <span style={{ fontWeight: 700, color: '#166534' }}>₦{invoice.amountPaid?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 14, fontWeight: 900 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Balance Due</span>
                    <span style={{ color: invoice.balanceDue > 0 ? '#dc2626' : '#166534' }}>₦{invoice.balanceDue?.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bank details (proforma) */}
          {invoice.type === 'proforma' && (
            <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Deposit Required</p>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#166534' }}>{invoice.depositPercent || 70}%</span>
                </div>
                <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Bank Details for Payment</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: 12 }}>
                  <div><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>2284429344 - Nzelu Akachukwu (Zenith Bank)</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-primary)' }}>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '12px 28px', textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)' }}>
            Generated by NGV ERP System · {new Date(invoice.createdAt).toLocaleString()} · {invoice.createdBy?.name || 'System'}
          </div>
        </div>
      </div>

      {/* ── PRINT VIEW ── */}
      <div className="print-template-container">
        {invoice.type === 'cash_sales' ? (
          <StandardSalesInvoicePrint invoice={invoice} />
        ) : (
          <ProformaInvoicePrint invoice={invoice} />
        )}
      </div>

      {/* ── MODALS ── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Invoice" size="sm">
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to delete invoice <strong style={{ color: 'var(--text-primary)' }}>{invoice.invoiceCode}</strong>?
          <br />This action is irreversible.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteModal(false)}
            className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
            Cancel
          </button>
          <button onClick={handleDelete}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
            Delete Invoice
          </button>
        </div>
      </Modal>

      <Modal isOpen={showCommitModal} onClose={() => setShowCommitModal(false)} title="Commit Payment" size="sm">
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
          Record payment for <strong style={{ color: 'var(--text-primary)' }}>{invoice.invoiceCode}</strong>. Stock will be deducted.
        </p>
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center py-2 px-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Grand Total</span>
            <span className="text-sm font-black">₦{invoice.grandTotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Already Paid</span>
            <span className="text-sm font-black" style={{ color: '#166534' }}>₦{(invoice.amountPaid || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Remaining</span>
            <span className="text-sm font-black text-red-600">₦{Math.max(0, invoice.grandTotal - (invoice.amountPaid || 0)).toLocaleString()}</span>
          </div>
          <div>
            <label className="text-xs font-bold tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Amount Paying Now (₦)</label>
            <input type="text" inputMode="numeric" value={commitAmount} onChange={(e) => setCommitAmount(e.target.value.replace(/[^0-9]/g, ''))}
              className="ngv-input text-lg font-bold" />
          </div>
          {commitAmount && parseFloat(commitAmount) > 0 && (
            <div className="flex justify-between items-center py-2 px-4 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
              <span className="text-xs font-semibold text-red-700">New Balance Due</span>
              <span className="text-sm font-black" style={{ color: Math.max(0, invoice.grandTotal - (invoice.amountPaid || 0) - parseFloat(commitAmount)) === 0 ? '#166534' : '#dc2626' }}>
                ₦{Math.max(0, invoice.grandTotal - (invoice.amountPaid || 0) - parseFloat(commitAmount)).toLocaleString()}
              </span>
            </div>
          )}
          {!invoice.isSupplied && (
            <div>
              <label className="text-xs font-bold tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Supply Status</label>
              <select value={commitIsSupplied ? 'supplied' : 'not_supplied'} onChange={(e) => setCommitIsSupplied(e.target.value === 'supplied')}
                className="ngv-select h-10 text-sm w-full">
                <option value="not_supplied">Not Supplied</option>
                <option value="supplied">Supplied</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCommitModal(false)}
            className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
            Cancel
          </button>
          <button onClick={handleCommit} disabled={!commitAmount || parseFloat(commitAmount) <= 0}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--ngv-active-bg)' }}>
            Commit Payment
          </button>
        </div>
      </Modal>

      <Modal isOpen={showConvertModal} onClose={() => { if (!converting) setShowConvertModal(false); }} title="Convert to Sales Invoice" size="sm">
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
          This will convert the proforma <strong style={{ color: 'var(--text-primary)' }}>{invoice.invoiceCode}</strong> into a
          Sales Invoice for <strong style={{ color: 'var(--text-primary)' }}>₦{invoice.grandTotal?.toLocaleString()}</strong>.
          Stock will be deducted and the proforma will be marked as converted.
        </p>
        <div className="space-y-4 mb-4">
          <div>
            <label className="text-[10px] font-bold tracking-wider uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Payment Status</label>
            <select value={convertPaymentStatus} onChange={(e) => { setConvertPaymentStatus(e.target.value); if (e.target.value !== 'part_payment') setConvertAmountPaid(''); }}
              className="ngv-select h-10 text-sm w-full">
              <option value="paid">Paid</option>
              <option value="part_payment">Part Payment</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          {convertPaymentStatus === 'part_payment' && (
            <div>
              <label className="text-[10px] font-bold tracking-wider uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Amount Paid (₦)</label>
              <input type="text" inputMode="numeric" value={convertAmountPaid}
                onChange={(e) => setConvertAmountPaid(e.target.value.replace(/[^0-9]/g, ''))}
                className="ngv-input h-10 text-sm w-full" placeholder="Enter amount paid" />
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold tracking-wider uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Supply Status</label>
            <select value={convertIsSupplied ? 'supplied' : 'not_supplied'} onChange={(e) => setConvertIsSupplied(e.target.value === 'supplied')}
              className="ngv-select h-10 text-sm w-full">
              <option value="not_supplied">Not Supplied</option>
              <option value="supplied">Supplied</option>
            </select>
          </div>
        </div>
        <p className="text-xs font-medium mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          This action cannot be undone. A new Sales Invoice will be created and you will be redirected.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowConvertModal(false)} disabled={converting}
            className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
            Cancel
          </button>
          <button onClick={handleConvert} disabled={converting}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#166534' }}>
            {converting ? 'Converting...' : 'Convert & Create Invoice'}
          </button>
        </div>
      </Modal>
    </>
  );
}
