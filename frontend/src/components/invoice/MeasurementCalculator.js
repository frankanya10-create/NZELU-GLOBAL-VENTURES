'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { HiOutlineXMark } from 'react-icons/hi2';

export default function MeasurementCalculator({ isOpen, onClose, onApply }) {
  const [calcYards, setCalcYards] = useState('');
  const [calcLength, setCalcLength] = useState('');
  const [calcWidth, setCalcWidth] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (isOpen && ref.current) {
      gsap.fromTo(ref.current, { opacity: 0, scale: 0.95, y: -5 }, {
        opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    let quantity = 0;
    let unit = 'meters';

    if (calcYards) {
      quantity = Math.round(parseFloat(calcYards) * 0.9144 * 100) / 100;
      unit = 'meters';
    } else if (calcLength && calcWidth) {
      quantity = Math.round(parseFloat(calcLength) * parseFloat(calcWidth) * 100) / 100;
      unit = 'sqm';
    }

    if (quantity <= 0) { toast.error('Invalid measurements.'); return; }
    onApply({ quantity, unit });
    toast.success(`Measurement applied: ${quantity} ${unit}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div ref={ref} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-surface-900">Measurement Calculator</h4>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="ngv-label">Yards → Meters</label>
            <input type="number" value={calcYards}
              onChange={(e) => { setCalcYards(e.target.value); setCalcLength(''); setCalcWidth(''); }}
              placeholder="Enter yards" className="ngv-input" />
            {calcYards && <p className="text-xs text-surface-500 mt-1">= {(parseFloat(calcYards) * 0.9144).toFixed(3)} meters</p>}
          </div>

          <div className="ngv-divider" />
          <p className="text-sm font-medium text-surface-700">Meters → Square Meters</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ngv-label text-xs">Length (m)</label>
              <input type="number" value={calcLength}
                onChange={(e) => { setCalcLength(e.target.value); setCalcYards(''); }}
                placeholder="Length" className="ngv-input" />
            </div>
            <div>
              <label className="ngv-label text-xs">Width (m)</label>
              <input type="number" value={calcWidth}
                onChange={(e) => { setCalcWidth(e.target.value); setCalcYards(''); }}
                placeholder="Width" className="ngv-input" />
            </div>
          </div>

          {calcLength && calcWidth && (
            <p className="text-xs text-surface-500">= {(parseFloat(calcLength) * parseFloat(calcWidth)).toFixed(3)} sqm</p>
          )}

          <button onClick={handleApply} className="ngv-btn-primary w-full"
            disabled={!calcYards && (!calcLength || !calcWidth)}>
            Apply to Quantity
          </button>
        </div>
      </div>
    </div>
  );
}
