'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function InvoiceTypeToggle({ type, onChange, invoiceCode }) {
  const indicatorRef = useRef(null);

  useEffect(() => {
    if (indicatorRef.current) {
      gsap.to(indicatorRef.current, {
        x: type === 'cash_sales' ? '100%' : '0%',
        duration: 0.3,
        ease: 'power2.inOut',
      });
    }
  }, [type]);

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex items-center bg-surface-100 rounded-xl p-1">
        <div ref={indicatorRef} className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300" />
        <button onClick={() => onChange('proforma')}
          className={`relative px-5 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors duration-200 ${type === 'proforma' ? 'text-ngv-800' : 'text-surface-600'}`}>
          Proforma Invoice
        </button>
        <button onClick={() => onChange('cash_sales')}
          className={`relative px-5 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors duration-200 ${type === 'cash_sales' ? 'text-ngv-800' : 'text-surface-600'}`}>
          Cash Sales Invoice
        </button>
      </div>
      <span className="text-sm font-mono text-surface-500">{invoiceCode}</span>
    </div>
  );
}
