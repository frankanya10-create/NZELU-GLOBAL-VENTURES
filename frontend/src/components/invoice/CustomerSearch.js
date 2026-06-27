'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { customersAPI } from '@/lib/api';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

export default function CustomerSearch({ onSelect, value, onChange }) {
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (value?.length >= 2) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await customersAPI.search(value);
          setResults(res.data.data);
          setShowDropdown(true);
        } catch {}
      }, 400);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [value]);

  const handleSelect = (customer) => {
    setSelected(customer);
    setShowDropdown(false);
    onChange(customer.name);
    onSelect(customer);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    onSelect(null);
    setResults([]);
  };

  return (
    <div className="relative">
      <label className="ngv-label">Bill To / Customer</label>
      <div className="relative">
        <input type="text" value={value || ''}
          onChange={(e) => { onChange(e.target.value); setSelected(null); }}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search customer by name or telephone..."
          className="ngv-input pl-10 pr-10" />
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        {value && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-surface-200 shadow-lg max-h-48 overflow-y-auto">
          {results.map(c => (
            <button key={c._id} onClick={() => handleSelect(c)}
              className="w-full px-4 py-3 text-left hover:bg-surface-50 text-sm flex justify-between items-center border-b border-surface-50 last:border-0">
              <div>
                <span className="font-medium text-surface-800 block">{c.name}</span>
                <span className="text-xs text-surface-500">{c.telephone}</span>
              </div>
              {c.creditBalance > 0 && <span className="text-xs text-red-500 font-medium">₦{c.creditBalance.toLocaleString()}</span>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-2 p-3 bg-ngv-50 rounded-xl">
          <p className="text-sm font-medium text-ngv-800">{selected.name}</p>
          <p className="text-xs text-ngv-600">{selected.telephone}{selected.email ? ` · ${selected.email}` : ''}</p>
          {selected.address && <p className="text-xs text-ngv-600 mt-0.5">{selected.address}</p>}
        </div>
      )}
    </div>
  );
}
