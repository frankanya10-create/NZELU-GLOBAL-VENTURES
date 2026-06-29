'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { invoicesAPI, customersAPI, productsAPI, rollsAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import {
  HiOutlinePlus, HiOutlineTrash,
  HiOutlineMagnifyingGlass, HiOutlineArrowLeft,
  HiOutlineBanknotes, HiOutlineDocumentText, HiOutlineCurrencyDollar,
  HiOutlineCheck,
} from 'react-icons/hi2';

const roleLabels = {
  administrator: 'Administrator',
  manager: 'Manager',
  cashier: 'Cashier',
  storekeeper: 'Storekeeper',
};

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [type, setType] = useState('proforma');
  const [invoiceCode, setInvoiceCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDate, setValidityDate] = useState('');
  const [billTo, setBillTo] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerTelephone, setCustomerTelephone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: '', unit: 'pcs', unitPrice: '', product: null, roll: null, rollId: '' }]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  const [amountPaid, setAmountPaid] = useState('');
  const [grandTotal, setGrandTotal] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [depositPercent, setDepositPercent] = useState('70');
  const [isSupplied, setIsSupplied] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Invoice search + auto-fill
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState([]);
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [invoiceSearchLoading, setInvoiceSearchLoading] = useState(false);
  const [loadedFrom, setLoadedFrom] = useState(null);

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(null);
  const [activeRolls, setActiveRolls] = useState({});

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const invoiceSearchCardRef = useRef(null);
  const detailsCardRef = useRef(null);
  const itemsCardRef = useRef(null);
  const summaryCardRef = useRef(null);
  const bankCardRef = useRef(null);
  const notesRef = useRef(null);
  const actionsRef = useRef(null);
  const delayRef = useRef(null);
  const productDelayRef = useRef(null);
  const animRan = useRef(false);

  useEffect(() => {
    loadNextCode(type);
    if (type === 'proforma') {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setValidityDate(d.toISOString().split('T')[0]);
    } else {
      setValidityDate('');
    }
  }, [type]);

  useEffect(() => { recalcTotals(); }, [items, amountPaid, discount]);

  useEffect(() => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (customerSearch.length >= 2) {
      delayRef.current = setTimeout(async () => {
        try {
          const res = await customersAPI.search(customerSearch);
          setCustomerResults(res.data.data);
          setShowCustomerDropdown(true);
        } catch {}
      }, 400);
    } else {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
    }
    return () => { if (delayRef.current) clearTimeout(delayRef.current); };
  }, [customerSearch]);

  // Invoice search debounce
  const invoiceDelayRef = useRef(null);
  useEffect(() => {
    if (invoiceDelayRef.current) clearTimeout(invoiceDelayRef.current);
    if (invoiceSearch.length >= 2) {
      setInvoiceSearchLoading(true);
      invoiceDelayRef.current = setTimeout(async () => {
        try {
          const res = await invoicesAPI.list({ search: invoiceSearch, limit: 10 });
          setInvoiceResults(res.data.data);
          setShowInvoiceDropdown(res.data.data.length > 0);
        } catch (e) { setInvoiceResults([]); setShowInvoiceDropdown(false); console.warn('Invoice search error:', e?.response?.status, e?.message); }
        finally { setInvoiceSearchLoading(false); }
      }, 400);
    } else {
      setInvoiceResults([]);
      setShowInvoiceDropdown(false);
      setInvoiceSearchLoading(false);
    }
    return () => { if (invoiceDelayRef.current) clearTimeout(invoiceDelayRef.current); };
  }, [invoiceSearch]);

  useEffect(() => {
    if (animRan.current) return;
    animRan.current = true;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(headerRef.current, { y: -20, opacity: 0, duration: 0.4 });
      tl.from([invoiceSearchCardRef.current, detailsCardRef.current, itemsCardRef.current, notesRef.current].filter(Boolean),
        { y: 20, opacity: 0, duration: 0.35, stagger: 0.06 }, '-=0.1');
      tl.from([summaryCardRef.current, bankCardRef.current, actionsRef.current].filter(Boolean),
        { y: 20, opacity: 0, duration: 0.35, stagger: 0.06 }, '-=0.2');
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      invoicesAPI.get(editId).then(res => {
        const inv = res.data.data;
        selectInvoice(inv);
      }).catch(() => toast.error('Failed to load invoice for editing.'));
    }
  }, []);

  const loadNextCode = async (invoiceType) => {
    try {
      const res = await invoicesAPI.nextCode(invoiceType || type);
      setInvoiceCode(res.data.code);
    } catch { setInvoiceCode('NGV-2026-000001'); }
  };

  const selectInvoice = async (inv) => {
    try {
      setSaving(true);
      const res = await invoicesAPI.get(inv._id);
      const data = res.data.data;
      setType(data.type);
      setDate(new Date(data.date).toISOString().split('T')[0]);
      if (data.validityDate) setValidityDate(new Date(data.validityDate).toISOString().split('T')[0]);
      setCustomer(data.customer || null);
      setCustomerName(data.customerSnapshot?.name || '');
      setCustomerTelephone(data.customerSnapshot?.telephone || '');
      setCustomerAddress(data.customerSnapshot?.address || '');
      setBillTo(data.billTo || '');
      setCustomerSearch(data.customerSnapshot?.name || '');
      setItems(data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice?.toString() || '',
        product: item.product?._id || item.product || null,
        roll: item.roll?._id || item.roll || null,
        rollId: item.rollId || '',
      })));
      setDiscount(data.discount?.toString() || '');
      setDiscountReason(data.discountReason || '');
      setDepositPercent(data.depositPercent?.toString() || '70');
      setIsSupplied(data.isSupplied || false);
      setPaymentStatus(data.paymentStatus || 'unpaid');
      setNotes(data.notes || '');
      setAmountPaid(data.amountPaid || '');
      setInvoiceCode(data.invoiceCode);
      setLoadedFrom({ code: data.invoiceCode, id: data._id });
      setInvoiceSearch('');
      setShowInvoiceDropdown(false);
      toast.success(`Loaded invoice ${data.invoiceCode}`);
    } catch (err) {
      toast.error('Failed to load invoice details.');
    } finally {
      setSaving(false);
    }
  };

  const recalcTotals = () => {
    const s = items.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * parseFloat(item.unitPrice || 0)), 0);
    const d = parseFloat(discount) || 0;
    const gt = Math.max(0, s - d);
    setSubtotal(s);
    setGrandTotal(gt);
    const ap = parseFloat(amountPaid) || 0;
    setBalanceDue(Math.max(0, gt - ap));
  };

  const addItem = () => setItems([...items, { description: '', quantity: '', unit: 'pcs', unitPrice: '', product: null, roll: null, rollId: '' }]);
  const removeItem = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const selectCustomer = (c) => {
    setCustomer(c);
    setCustomerName(c.name);
    setCustomerTelephone(c.telephone || '');
    setCustomerAddress(c.address || '');
    setBillTo(c.name);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  };

  const searchProducts = (query, index) => {
    setProductSearch(query);
    if (productDelayRef.current) clearTimeout(productDelayRef.current);
    if (query.length >= 1) {
      productDelayRef.current = setTimeout(async () => {
        try {
          const res = await productsAPI.list({ search: query, limit: 10 });
          setProductResults(res.data.data);
          setShowProductDropdown(index);
        } catch {}
      }, 300);
    } else {
      setProductResults([]);
      setShowProductDropdown(null);
    }
  };

  const selectProduct = async (product, index) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      description: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
      unitPrice: ((user?.role === 'cashier' ? (product.prices?.selling) : (product.prices?.selling)) || 0).toString(),
      unit: product.unit || 'pcs',
      product: product._id,
      roll: null,
      rollId: '',
    };
    setItems(newItems);
    setShowProductDropdown(null);
    if (product.hasRollTracking) {
      try {
        const res = await rollsAPI.getActiveByProduct(product._id);
        setActiveRolls(prev => ({ ...prev, [index]: res.data.data }));
      } catch {}
    }
  };

  const selectRoll = (index, roll) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], roll: roll._id, rollId: roll.rollId };
    setItems(newItems);
  };

  const handleSubmit = async (action) => {
    if (items.some(i => !i.description || !i.quantity || parseInt(i.quantity) <= 0 || parseFloat(i.unitPrice || 0) <= 0)) {
      toast.error('Please fill in all line item fields with valid values.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type, invoiceCode, date,
        validityDate: validityDate || undefined,
        customer: customer?._id,
        billTo: billTo || customerName,
        customerSnapshot: {
          name: customerName || 'Walk-in Customer',
          telephone: customerTelephone,
          address: customerAddress,
        },
        items: items.map(item => ({
          description: item.description, quantity: item.quantity, unit: item.unit,
          unitPrice: parseFloat(item.unitPrice || 0), total: (parseInt(item.quantity) || 0) * parseFloat(item.unitPrice || 0),
          product: item.product, roll: item.roll, rollId: item.rollId,
        })),
        subtotal,
        discount: parseFloat(discount) || 0,
        discountReason: discountReason || undefined,
        depositPercent: type === 'proforma' ? parseInt(depositPercent) || 70 : undefined,
        isSupplied,
        amountPaid: type === 'cash_sales' ? parseFloat(amountPaid || 0) : 0,
        grandTotal, balanceDue, paymentStatus, notes,
      };
      let invoice;
      if (loadedFrom?.id) {
        const res = await invoicesAPI.update(loadedFrom.id, payload);
        invoice = res.data.data;
      } else {
        const res = await invoicesAPI.create(payload);
        invoice = res.data.data;
        if (type === 'cash_sales' && parseFloat(amountPaid || 0) > 0) {
          await invoicesAPI.commit(invoice._id, { amountPaid });
        }
      }
      router.push('/invoices/' + invoice._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const cardClass = 'rounded-3xl overflow-hidden';
  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    boxShadow: 'var(--shadow-lg)',
  };
  const cardHeaderClass = 'px-6 py-4 border-b';
  const cardHeaderBorder = { borderColor: 'var(--border-primary)' };
  const cardTitleClass = 'text-xs font-black tracking-wider';
  const cardTitleStyle = { color: 'var(--text-primary)' };

  return (
    <div ref={containerRef} className="font-lufga">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.push('/invoices')}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors group"
              style={{ color: 'var(--text-muted)' }}>
              <HiOutlineArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to invoices
            </button>
            </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {type === 'proforma' ? 'New Proforma Invoice' : 'New Cash Sales Invoice'}
          </h1>
          <p className="text-sm font-medium mt-1 flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-muted)' }}>
            <span>{invoiceCode}</span>
            <span>·</span>
            <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {loadedFrom && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                style={{ backgroundColor: 'var(--ngv-active-bg)', color: 'var(--ngv-active-text)' }}>
                Based on: {loadedFrom.code}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <button onClick={() => { setType('proforma'); setAmountPaid(''); setLoadedFrom(null); setDepositPercent('70'); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: type === 'proforma' ? 'var(--bg-secondary)' : 'transparent',
                color: type === 'proforma' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: type === 'proforma' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              <HiOutlineDocumentText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Proforma
            </button>
            <button onClick={() => { setType('cash_sales'); setValidityDate(''); setLoadedFrom(null); setIsSupplied(false); setPaymentStatus('unpaid'); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: type === 'cash_sales' ? 'var(--bg-secondary)' : 'transparent',
                color: type === 'cash_sales' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: type === 'cash_sales' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              <HiOutlineCurrencyDollar className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Cash Sales
            </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Invoice Search - Load existing invoice */}
          <div ref={invoiceSearchCardRef} className={`${cardClass} overflow-visible`} style={cardStyle}>
            <div className={cardHeaderClass} style={cardHeaderBorder}>
              <h3 className={cardTitleClass} style={cardTitleStyle}>LOAD EXISTING INVOICE</h3>
            </div>
            <div className="p-6">
              <div className="relative">
                <input type="text" value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  onFocus={() => invoiceResults.length > 0 && setShowInvoiceDropdown(true)}
                  placeholder="Search by invoice code, customer name or phone..."
                  className="ngv-input h-11 pl-10 text-sm" />
                <HiOutlineMagnifyingGlass className="absolute left-3 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                {invoiceSearchLoading && (
                  <span className="absolute right-3 top-3">
                    <span className="w-4 h-4 border-2 rounded-full inline-block animate-spin" style={{ borderColor: 'var(--border-secondary)', borderTopColor: '#166534' }} />
                  </span>
                )}
                {showInvoiceDropdown && invoiceResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-2xl overflow-hidden max-h-64 overflow-y-auto"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    {invoiceResults.map(inv => (
                      <button key={inv._id} onClick={() => selectInvoice(inv)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black tracking-tight" style={{ color: '#166534' }}>{inv.invoiceCode}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              inv.type === 'cash_sales' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>{inv.type === 'cash_sales' ? 'CSH' : 'PRO'}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                              inv.paymentStatus === 'part_payment' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{inv.paymentStatus?.replace('_', ' ')}</span>
                          </div>
                          <p className="text-xs font-medium truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {inv.customerSnapshot?.name || inv.billTo || 'Walk-in'}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>₦{inv.grandTotal?.toLocaleString()}</p>
                          <p className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {invoiceSearch.length >= 2 && !invoiceSearchLoading && invoiceResults.length === 0 && (
                  <p className="text-xs font-medium mt-1.5" style={{ color: 'var(--text-muted)' }}>No matching invoices found.</p>
                )}
              </div>
              <p className="text-[10px] font-medium mt-2" style={{ color: 'var(--text-muted)' }}>
                Search for an existing invoice to auto-fill this form with its details.
              </p>
            </div>
          </div>

          {/* Invoice Details */}
          <div ref={detailsCardRef} className={`${cardClass} overflow-visible`} style={cardStyle}>
            <div className={cardHeaderClass} style={cardHeaderBorder}>
              <h3 className={cardTitleClass} style={cardTitleStyle}>INVOICE DETAILS</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="field-group relative">
                  <input type="date" id="inv-date" value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`peer ngv-input h-12 pt-4 text-sm ${date ? 'border-ngv-600' : ''}`}
                    placeholder=" " />
                  <label htmlFor="inv-date"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      date ? 'top-1 text-[10px] font-bold' : 'top-3.5 text-sm'
                    } peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold`}
                    style={{ color: 'var(--text-muted)' }}>
                    Invoice Date
                  </label>
                </div>
                {type === 'proforma' && (
                  <div className="field-group relative">
                    <input type="date" id="val-date" value={validityDate} readOnly
                      className="peer ngv-input h-12 pt-4 text-sm opacity-70"
                      placeholder=" " />
                    <label htmlFor="val-date"
                      className="absolute left-4 top-1 text-[10px] font-bold pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}>
                      Validity Date
                    </label>
                  </div>
                )}
              </div>

              {/* Customer Search - Quick fill */}
              <div className="relative">
                <label className="text-[10px] font-bold tracking-wider uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  Search Existing Customer
                </label>
                <input type="text" value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                  placeholder="Search by name or telephone to auto-fill..."
                  className="ngv-input h-11 pl-10 text-sm" />
                <HiOutlineMagnifyingGlass className="absolute left-3 top-[39px] w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-2xl overflow-hidden max-h-48 overflow-y-auto"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    {customerResults.map(c => (
                      <button key={c._id} onClick={() => selectCustomer(c)}
                        className="w-full px-4 py-3 text-left flex justify-between items-center transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span className="text-sm font-semibold">{c.name}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{c.telephone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Details */}
              <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Customer Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="field-group relative col-span-2">
                  <input type="text" id="cust-name" value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="peer ngv-input h-12 pt-4 text-sm" placeholder=" " />
                  <label htmlFor="cust-name"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${customerName ? 'top-1 text-[10px] font-bold' : 'top-3.5 text-sm'} peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold`}
                    style={{ color: 'var(--text-muted)' }}>
                    Client Name *
                  </label>
                </div>
                <div className="field-group relative">
                  <input type="tel" id="cust-tel" value={customerTelephone}
                    onChange={(e) => setCustomerTelephone(e.target.value)}
                    className="peer ngv-input h-12 pt-4 text-sm" placeholder=" " />
                  <label htmlFor="cust-tel"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${customerTelephone ? 'top-1 text-[10px] font-bold' : 'top-3.5 text-sm'} peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold`}
                    style={{ color: 'var(--text-muted)' }}>
                    Telephone
                  </label>
                </div>
                <div className="field-group relative col-span-2">
                  <input type="text" id="cust-addr" value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="peer ngv-input h-12 pt-4 text-sm" placeholder=" " />
                  <label htmlFor="cust-addr"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${customerAddress ? 'top-1 text-[10px] font-bold' : 'top-3.5 text-sm'} peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold`}
                    style={{ color: 'var(--text-muted)' }}>
                    Address
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div ref={itemsCardRef} className={cardClass} style={cardStyle}>
            <div className={`${cardHeaderClass} flex items-center justify-between`} style={cardHeaderBorder}>
              <h3 className={cardTitleClass} style={cardTitleStyle}>LINE ITEMS</h3>
              <button onClick={addItem}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[10px] font-bold transition-all duration-200"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ngv-active-bg)'; e.currentTarget.style.color = 'var(--ngv-active-text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <HiOutlinePlus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ color: 'var(--text-primary)' }}>
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <th className="text-left px-4 py-3 text-[10px] font-bold tracking-wider uppercase w-8" style={{ color: 'var(--text-muted)' }}>#</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold tracking-wider uppercase min-w-[180px]" style={{ color: 'var(--text-muted)' }}>Description</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold tracking-wider uppercase w-16" style={{ color: 'var(--text-muted)' }}>Qty</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold tracking-wider uppercase w-14" style={{ color: 'var(--text-muted)' }}>Unit</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold tracking-wider uppercase w-28" style={{ color: 'var(--text-muted)' }}>Price</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold tracking-wider uppercase w-24" style={{ color: 'var(--text-muted)' }}>Total</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold tracking-wider uppercase w-20" style={{ color: 'var(--text-muted)' }}>Roll</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                  {items.map((item, i) => (
                    <tr key={i} className="transition-colors" style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="px-4 py-3 text-xs font-bold align-top pt-5" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input type="text" value={item.description}
                            onChange={(e) => { updateItem(i, 'description', e.target.value); searchProducts(e.target.value, i); }}
                            placeholder="Search or type..."
                            className="w-full bg-transparent text-sm font-medium outline-none py-1.5"
                            style={{ color: 'var(--text-primary)' }} />
                          {showProductDropdown === i && productResults.length > 0 && (
                            <div className="absolute z-20 mt-1 left-0 right-0 rounded-2xl overflow-hidden max-h-48 overflow-y-auto"
                              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                              {productResults.map(p => (
                                <button key={p._id} onClick={() => selectProduct(p, i)}
                                  className="w-full px-3 py-2.5 text-left flex justify-between items-center transition-colors text-sm"
                                  style={{ color: 'var(--text-primary)' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                  <span className="font-semibold">{p.name}</span>
                                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>₦{p.prices?.selling?.toLocaleString()}/{p.unit}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={item.quantity || ''}
                          onChange={(e) => updateItem(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-transparent text-sm font-bold text-center outline-none py-1.5" min="0" step="0.01"
                          style={{ color: 'var(--text-primary)' }} />
                      </td>
                      <td className="px-4 py-3">
                        <select value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-center outline-none py-1.5"
                          style={{ color: 'var(--text-secondary)' }}>
                          <option value="pcs">pcs</option>
                          <option value="yards">yds</option>
                          <option value="sqm">sqm</option>
                          <option value="rolls">rolls</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={item.unitPrice}
                          onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                          className="w-full bg-transparent text-sm font-bold text-right outline-none py-1.5" min="0" step="any"
                          style={{ color: 'var(--text-primary)' }} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-black align-top pt-5" style={{ color: 'var(--text-primary)' }}>
                        ₦{((parseInt(item.quantity) || 0) * parseFloat(item.unitPrice || 0)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 align-top pt-4">
                        {item.product && activeRolls[i]?.length > 0 ? (
                          <select value={item.rollId}
                            onChange={(e) => { const roll = activeRolls[i].find(r => r.rollId === e.target.value); selectRoll(i, roll || e.target.value); }}
                            className="w-full bg-transparent text-[10px] font-bold outline-none py-1"
                            style={{ color: 'var(--text-secondary)' }}>
                            <option value="">Select</option>
                            {activeRolls[i].map(r => (
                              <option key={r._id} value={r.rollId}>{r.rollId}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.rollId || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top pt-4">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)}
                            className="p-1.5 rounded-xl transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div ref={notesRef}>
            <div className={cardClass} style={cardStyle}>
              <div className={cardHeaderClass} style={cardHeaderBorder}>
                <h3 className={cardTitleClass} style={cardTitleStyle}>NOTES</h3>
              </div>
              <div className="p-6">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
                  className="ngv-input resize-none h-20 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Invoice Summary */}
          <div ref={summaryCardRef} className={cardClass} style={cardStyle}>
            <div className={cardHeaderClass} style={cardHeaderBorder}>
              <h3 className={cardTitleClass} style={cardTitleStyle}>INVOICE SUMMARY</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="field-group relative">
                  <input type="text" inputMode="numeric" id="discount" value={discount}
                    onChange={(e) => setDiscount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="peer ngv-input h-10 pt-3 text-sm font-bold" placeholder=" "
                    style={{ color: discount && parseFloat(discount) > 0 ? '#dc2626' : undefined }} />
                  <label htmlFor="discount"
                    className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                      discount !== '' ? 'top-0.5 text-[9px] font-bold' : 'top-2.5 text-xs'
                    } peer-focus:top-0.5 peer-focus:text-[9px] peer-focus:font-bold`}
                    style={{ color: 'var(--text-muted)' }}>
                    Discount (₦)
                  </label>
                </div>
                {discount && parseFloat(discount) > 0 && (
                  <div className="field-group relative">
                    <input type="text" id="discount-reason" value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="peer ngv-input h-10 pt-3 text-xs" placeholder=" "
                      maxLength={200} />
                    <label htmlFor="discount-reason"
                      className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                        discountReason ? 'top-0.5 text-[9px] font-bold' : 'top-2.5 text-xs'
                      } peer-focus:top-0.5 peer-focus:text-[9px] peer-focus:font-bold`}
                      style={{ color: 'var(--text-muted)' }}>
                      Discount Reason
                    </label>
                  </div>
                )}
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--border-primary)' }} />
              <div className="flex justify-between items-center py-1">
                <span className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                <span className="text-xl font-black" style={{ color: '#166534' }}>₦{grandTotal.toLocaleString()}</span>
              </div>

              {/* Proforma status section */}
              {type === 'proforma' && (
                <div className="pt-3 space-y-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="field-group relative">
                    <input type="text" inputMode="numeric" id="deposit-pct" value={depositPercent}
                      onChange={(e) => setDepositPercent(e.target.value.replace(/[^0-9]/g, ''))}
                      className="peer ngv-input h-12 pt-4 text-lg font-black" placeholder=" " />
                    <label htmlFor="deposit-pct"
                      className={'absolute left-4 transition-all duration-200 pointer-events-none ' + (depositPercent !== '' ? 'top-0.5 text-[9px] font-bold' : 'top-3.5 text-sm')}
                      style={{ color: 'var(--text-muted)' }}>
                      Deposit %
                    </label>
                  </div>
                </div>
              )}

              {/* Cash Sales payment section */}
              {type === 'cash_sales' && (
                <div className="pt-3 space-y-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Payment</p>
                  <div className="field-group relative">
                    <input type="text" inputMode="numeric" id="amt-paid" value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9]/g, ''))}
                      className="peer ngv-input h-12 pt-4 text-lg font-black" placeholder=" " />
                    <label htmlFor="amt-paid"
                      className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                        amountPaid !== '' ? 'top-0.5 text-[9px] font-bold' : 'top-3.5 text-sm'
                      } peer-focus:top-0.5 peer-focus:text-[9px] peer-focus:font-bold`}
                      style={{ color: 'var(--text-muted)' }}>
                      Amount Paid (₦)
                    </label>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Balance Due</span>
                    <span className={`text-lg font-black ${balanceDue > 0 ? 'text-red-600' : ''}`}
                      style={{ color: balanceDue > 0 ? '' : '#166534' }}>
                      ₦{balanceDue.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold tracking-wider uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Payment Status</label>
                      <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
                        className="ngv-select h-10 text-sm">
                        <option value="unpaid">Unpaid</option>
                        <option value="part_payment">Part Payment</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold tracking-wider uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Supply Status</label>
                      <select value={isSupplied ? 'supplied' : 'not_supplied'} onChange={(e) => setIsSupplied(e.target.value === 'supplied')}
                        className="ngv-select h-10 text-sm">
                        <option value="not_supplied">Not Supplied</option>
                        <option value="supplied">Supplied</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank Details */}
          {type === 'proforma' && (
            <div ref={bankCardRef} className={cardClass} style={cardStyle}>
              <div className={cardHeaderClass} style={cardHeaderBorder}>
                <h3 className={cardTitleClass} style={cardTitleStyle}>
                  <HiOutlineBanknotes className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  BANK DETAILS
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { label: 'Account', value: '2284429344 - Nzelu Akachukwu (Zenith Bank)' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div ref={actionsRef} className="space-y-3 pt-1">
            <button onClick={() => handleSubmit('save')} disabled={saving}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
              style={{ backgroundColor: 'var(--ngv-active-bg)' }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.opacity = '1'; }}>
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <HiOutlineCheck className="w-4 h-4" />
                  {type === 'cash_sales' ? 'Create Cash Sales Invoice' : 'Create Proforma Invoice'}
                </span>
              )}
            </button>
            <button onClick={() => router.push('/invoices')}
              className="w-full h-12 rounded-2xl text-sm font-bold transition-all duration-200"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
