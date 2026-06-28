'use client';
import PrintStyles from './PrintStyles';

const Checked = () => (
  <span className="print-checkbox checked" />
);

const Unchecked = () => (
  <span className="print-checkbox" />
);

export default function StandardSalesInvoicePrint({ invoice }) {
  if (!invoice) return null;

  const paid = invoice.paymentStatus === 'paid';
  const partPayment = invoice.paymentStatus === 'part_payment';
  const unpaid = invoice.paymentStatus === 'unpaid';
  const supplied = invoice.isSupplied;
  const notSupplied = !invoice.isSupplied;

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
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Cash Sales Invoice</div>
            
          </div>
        </div>

        {/* ── METADATA SECTION ── */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: 16 }}>
          {/* Left: Invoice details */}
          <div className="print-meta-box" style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              <div><span className="label">Invoice No.</span><div className="value" style={{ fontFamily: 'monospace' }}>{invoice.invoiceCode}</div></div>
              <div><span className="label">Invoice Date</span><div className="value">{new Date(invoice.date).toLocaleDateString('en-GB')}</div></div>
              <div style={{ gridColumn: '1 / -1', marginTop: 2 }}><span className="label">Bill To</span><div className="value">{invoice.customerSnapshot?.name || invoice.billTo || 'Walk-in Customer'}</div></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="label">Customer Tel</span>
                <div className="value" style={{ fontWeight: 500 }}>{invoice.customerSnapshot?.telephone || '—'}</div>
              </div>
            </div>
          </div>

          {/* Right: Invoice Summary checkboxes */}
          <div className="print-meta-box" style={{ flex: 1 }}>
            <div className="print-section-title" style={{ border: 'none', padding: 0, margin: '0 0 6px 0' }}>Invoice Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Status</span>
                  <div className="print-checkbox-row">{paid ? <Checked /> : <Unchecked />} Paid</div>
                  <div className="print-checkbox-row">{partPayment ? <Checked /> : <Unchecked />} Part Payment</div>
                  <div className="print-checkbox-row">{unpaid ? <Checked /> : <Unchecked />} Unpaid</div>
                </div>
                <div style={{ width: 1, background: '#e5e7eb' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Supplied Status</span>
                  <div className="print-checkbox-row">{supplied ? <Checked /> : <Unchecked />} Supplied</div>
                  <div className="print-checkbox-row">{notSupplied ? <Checked /> : <Unchecked />} Not Supplied</div>
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
                <th style={{ width: '50%' }}>Description</th>
                <th className="center" style={{ width: '12%' }}>Qty</th>
                <th className="right" style={{ width: '18%' }}>Unit Price (₦)</th>
                <th className="right" style={{ width: '20%' }}>Total (₦)</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={i}>
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

        {/* ── TOTALS ── */}
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>₦{invoice.subtotal?.toLocaleString()}</span>
            </div>
            
            <div style={{ height: 1, background: '#d1d5db', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, fontWeight: 900 }}>
              <span>Grand Total</span>
              <span>₦{invoice.grandTotal?.toLocaleString()}</span>
            </div>
            <div style={{ height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
              <span style={{ color: '#6b7280' }}>Amount Paid</span>
              <span style={{ fontWeight: 700, color: '#004B23' }}>₦{invoice.amountPaid?.toLocaleString()}</span>
            </div>
            <div className="print-total-block" style={{ marginTop: 4 }}>
              <span>Balance Due</span>
              <span>₦{(invoice.balanceDue ?? invoice.grandTotal).toLocaleString()}</span>
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

        {/* ── FOOTER: TERMS + SIGNATURE ── */}
        <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 16, borderTop: '1px solid #e5e7eb' }}>
          {/* Terms & Conditions */}
          <div className="print-footer-box" style={{ flex: 1 }}>
            <div className="title">Terms &amp; Conditions</div>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 14, lineHeight: 1.7 }}>
              <li>Ownership of goods remains with NGV Enterprise until full payment is received.</li>
              <li>All measurements must be verified onsite before installation. Nzelu Global Ventures is not liable for site-measurement discrepancies.</li>
              <li>Delivery timelines commence after deposit confirmation.</li>
              <li>Custom-cut materials are non-returnable and non-refundable.</li>
              <li>Claims for damages must be reported within 48 hours of delivery.</li>
            </ul>
          </div>

          {/* Signature */}
          <div style={{ width: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div className="print-footer-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="title">Authorized Signature</div>
              <img src="/signature.png" alt="Signature" style={{ width: 140, height: 'auto', marginTop: 2 }} />
              <div style={{ borderTop: '1px solid #111', width: 180, marginTop: 2, paddingTop: 3, textAlign: 'left', fontSize: 10, fontWeight: 600 }}>
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER NOTE ── */}
        <div style={{ padding: '8px 24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 8, color: '#9ca3af' }}>
          Generated by Nzelu Global Ventures ERP · {invoice.createdBy?.name || 'System'} · {new Date().toLocaleDateString('en-GB')} · E&amp;OE
        </div>
      </div>
    </div>
  );
}
