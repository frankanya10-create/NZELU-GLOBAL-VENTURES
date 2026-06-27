'use client';
import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { HiOutlineXMark } from 'react-icons/hi2';

export default function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.95, y: 20 }, {
        opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.7)',
      });
    }
    if (!isOpen && modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, { opacity: 0, scale: 0.95, y: -10, duration: 0.15 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current && onClose) onClose(); }}
    >
      <div ref={modalRef} className={`bg-white rounded-2xl shadow-xl w-full ${sizes[size] || sizes.md} max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="text-lg font-bold text-surface-900">{title}</h2>
            {showClose && onClose && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
