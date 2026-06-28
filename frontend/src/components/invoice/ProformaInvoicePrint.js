'use client';
import PrintStyles from './PrintStyles';

export default function ProformaInvoicePrint({ invoice }) {
  if (!invoice) return null;

  const subtotal = invoice.subtotal || 0;
  const grandTotal = invoice.grandTotal || subtotal;

  return (
    <div className="print-body">
      <PrintStyles />

      <div className="print-page" style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        {/* ── HEADER BANNER ── */}
        <div className="print-header-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/logo.png" alt="NGV Logo" className="print-logo" />
            <div>
              <div className="print-company-name">NZELU GLOBAL VENTURES</div>
              <div className="print-company-sub">Premium Tarpaulins, Carpets, Centre Rugs, Artificial Grass &amp; Tent Installations</div>
              <div className="print-company-contacts">Head Office: 234 Agege Motor Road, Mushin, Lagos<br />Branch Office: 185 Dopemu Road, Agege, Lagos (Greater Path Mall)<br />Email: nzeluglobalventures@gmail.com</div>
            </div>
          </div>
          <div className="print-company-right">
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Proforma Invoice</div>
            <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2, textAlign: 'right' }}>Quotation · Valid 14 Days</div>
          </div>
        </div>

        {/* ── METADATA SECTION ── */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: 16 }}>
          {/* Left: Proforma details */}
          <div className="print-meta-box" style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              <div><span className="label">Proforma No.</span><div className="value" style={{ fontFamily: 'monospace' }}>{invoice.invoiceCode}</div></div>
              <div><span className="label">Proforma Date</span><div className="value">{new Date(invoice.date).toLocaleDateString('en-GB')}</div></div>
              <div><span className="label">Validity Date</span><div className="value">{invoice.validityDate ? new Date(invoice.validityDate).toLocaleDateString('en-GB') : '14 days from date'}</div></div>
              <div><span className="label">Validity</span><div className="value" style={{ color: '#004B23', fontWeight: 800 }}>14 Days</div></div>
              <div style={{ gridColumn: '1 / -1', marginTop: 2 }}><span className="label">Bill To</span><div className="value">{invoice.customerSnapshot?.name || invoice.billTo || 'Walk-in Customer'}</div></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="label">Customer Tel</span>
                <div className="value" style={{ fontWeight: 500 }}>{invoice.customerSnapshot?.telephone || '—'}</div>
              </div>
            </div>
          </div>

          {/* Right: Proforma Summary */}
          <div className="print-meta-box" style={{ flex: 1 }}>
            <div className="print-section-title" style={{ border: 'none', padding: 0, margin: '0 0 6px 0' }}>Proforma Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Deposit Required</span>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#004B23', marginTop: 2 }}>
                  {invoice.depositPercent || 70}% Mobilization Deposit
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bank Details</span>
                <div style={{ fontSize: 10, marginTop: 3, lineHeight: 1.6 }}>
                  <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Account Number:</span></div>
                  <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.5, marginBottom: 4 }}>2284429344</div>
                  <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Account Name:</span></div>
                  <div style={{ fontWeight: 600 }}>Nzelu Akachukwu</div>
                  <div style={{ marginTop: 2 }}><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Bank:</span> <span style={{ fontWeight: 600 }}>Zenith Bank</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div style={{ padding: '0 24px 16px' }}>
          <table className="print-table">
            <thead>
              <tr>
                <th className="center" style={{ width: '8%' }}>S/N</th>
                <th style={{ width: '42%' }}>Description</th>
                <th className="center" style={{ width: '12%' }}>Qty</th>
                <th className="right" style={{ width: '18%' }}>Unit Price (₦)</th>
                <th className="right" style={{ width: '20%' }}>Total (₦)</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="center" style={{ color: '#6b7280' }}>{i + 1}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{item.description}</span>
                    {item.rollId && <span style={{ fontSize: 9, color: '#6b7280', display: 'block' }}>Roll: {item.rollId}</span>}
                  </td>
                  <td className="center">{item.quantity} {item.unit}</td>
                  <td className="right">{item.unitPrice?.toLocaleString()}</td>
                  <td className="right" style={{ fontWeight: 700 }}>{item.total?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── CALCULATION TOTALS ── */}
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ height: 1, background: '#d1d5db', margin: '2px 0' }} />
            <div className="print-total-block" style={{ marginTop: 4 }}>
              <span>Grand Total</span>
              <span>₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── NOTES ── */}
        {invoice.notes && (
          <div style={{ padding: '0 24px 16px' }}>
            <div className="print-footer-box" style={{ background: '#f9fafb' }}>
              <div className="title">Notes</div>
              <p style={{ fontSize: 10, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
            </div>
          </div>
        )}

        {/* ── FOOTER: SIGNATURE ── */}
        <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 16, borderTop: '1px solid #e5e7eb' }}>
          <div className="print-footer-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 280 }}>
            <div className="title">Authorized Signature</div>
            <img src="/signature.png" alt="Signature" style={{ width: 140, height: 'auto', marginTop: 2 }} />
            <div style={{ borderTop: '1px solid #111', width: 200, marginTop: 2, paddingTop: 3, textAlign: 'left', fontSize: 10, fontWeight: 600 }}>
              Authorized Signatory — Nzelu Global Ventures
            </div>
          </div>
        </div>

        {/* ── FOOTER NOTE ── */}
        <div style={{ padding: '8px 24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 8, color: '#9ca3af' }}>
          This is a computer-generated proforma invoice. Valid for 14 days from the proforma date. · Generated by Nzelu Global Ventures ERP · {invoice.createdBy?.name || 'System'}
        </div>
      </div>
    </div>
  );
}
