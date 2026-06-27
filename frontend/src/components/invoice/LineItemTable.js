'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCalculator } from 'react-icons/hi2';

export default function LineItemTable({ items, onChange, onAdd, onRemove, onOpenCalc, productSearch, showProductDropdown, productResults, onProductSearch, onSelectProduct, activeRolls, onSelectRoll, user }) {
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current && items.length > 0) {
      const rows = tableRef.current.querySelectorAll('tbody tr:last-child');
      gsap.fromTo(rows, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' });
    }
  }, [items.length]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="ngv-card">
      <div className="ngv-card-header flex items-center justify-between">
        <h3 className="font-semibold text-surface-900">Line Items</h3>
        <button onClick={onAdd} className="ngv-btn-primary ngv-btn-sm">
          <HiOutlinePlus className="w-4 h-4 mr-1" /> Add Item
        </button>
      </div>
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="ngv-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th className="min-w-[200px]">Description</th>
              <th className="w-20">Qty</th>
              <th className="w-20">Unit</th>
              <th className="w-28">Unit Price (₦)</th>
              <th className="w-28">Total (₦)</th>
              <th className="w-24">Roll ID</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="text-center text-surface-500">{i + 1}</td>
                <td>
                  <div className="relative">
                    <input type="text" value={item.description}
                      onChange={(e) => { updateItem(i, 'description', e.target.value); onProductSearch?.(e.target.value, i); }}
                      placeholder="Search or type description..." className="ngv-input !border-0 !bg-transparent !px-0 !py-1 text-sm" />
                    {showProductDropdown === i && productResults?.length > 0 && (
                      <div className="absolute z-20 mt-1 left-0 right-0 bg-white rounded-xl border border-surface-200 shadow-lg max-h-48 overflow-y-auto">
                        {productResults.map(p => (
                          <button key={p._id} onClick={() => onSelectProduct?.(p, i)}
                            className="w-full px-3 py-2 text-left hover:bg-surface-50 text-sm flex justify-between">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-surface-500">₦{p.prices?.selling?.toLocaleString()}/{p.unit}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <input type="number" value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="ngv-input !border-0 !bg-transparent !px-0 !py-1 text-sm text-center w-full" min="0" step="0.01" />
                    <button onClick={() => onOpenCalc?.(i)} className="p-1 text-surface-400 hover:text-ngv-700 transition-colors" title="Measurement Calculator">
                      <HiOutlineCalculator className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td>
                  <select value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)}
                    className="ngv-select !border-0 !bg-transparent !px-0 !py-1 text-sm">
                    <option value="pcs">pcs</option><option value="meters">m</option>
                    <option value="yards">yds</option><option value="sqm">sqm</option>
                    <option value="rolls">rolls</option><option value="sets">sets</option>
                  </select>
                </td>
                <td>
                  <input type="number" value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="ngv-input !border-0 !bg-transparent !px-0 !py-1 text-sm text-right" min="0" step="0.01" />
                </td>
                <td className="text-right font-medium text-surface-800">₦{(item.quantity * item.unitPrice).toLocaleString()}</td>
                <td>
                  {item.product && activeRolls?.[i]?.length > 0 ? (
                    <select value={item.rollId} onChange={(e) => { const roll = activeRolls[i].find(r => r.rollId === e.target.value); onSelectRoll?.(i, roll || { rollId: e.target.value }); }}
                      className="ngv-select !border-0 !bg-transparent !px-0 !py-1 text-xs">
                      <option value="">Select Roll</option>
                      {activeRolls[i].map(r => (
                        <option key={r._id} value={r.rollId}>{r.rollId} ({r.remainingBalance} left)</option>
                      ))}
                    </select>
                  ) : <span className="text-xs text-surface-400">{item.rollId || '—'}</span>}
                </td>
                <td className="text-center">
                  {items.length > 1 && (
                    <button onClick={() => onRemove?.(i)} className="p-1 text-surface-400 hover:text-red-500 transition-colors">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
