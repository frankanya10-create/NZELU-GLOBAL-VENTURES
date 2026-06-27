'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function InvoiceSummary({ subtotal, grandTotal, type, amountPaid, onAmountPaidChange, balanceDue, paymentStatus }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [subtotal, grandTotal]);

  return (
    <div ref={ref} className="ngv-card">
      <div className="ngv-card-header"><h3 className="font-semibold text-surface-900">Invoice Summary</h3></div>
      <div className="ngv-card-body space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-surface-600">Subtotal</span>
            <span className="font-medium">₦{subtotal.toLocaleString()}</span>
          </div>

          <div className="ngv-divider" />

          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total</span>
            <span className="text-ngv-800">₦{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {type === 'cash_sales' && (
          <>
            <div className="ngv-divider" />
            <div>
              <label className="ngv-label">Amount Paid (₦)</label>
              <input type="number" value={amountPaid}
                onChange={(e) => onAmountPaidChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className="ngv-input text-lg font-bold" placeholder="0" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-600">Balance Due</span>
              <span className={`font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-ngv-700'}`}>
                ₦{balanceDue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="ngv-label mb-0">Status:</span>
              <span className={`ngv-badge ${paymentStatus === 'paid' ? 'ngv-badge-success' : paymentStatus === 'part_payment' ? 'ngv-badge-warning' : 'ngv-badge-neutral'}`}>
                {paymentStatus.replace('_', ' ')}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
