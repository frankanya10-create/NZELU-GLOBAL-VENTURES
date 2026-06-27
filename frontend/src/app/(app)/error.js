'use client';
import { useEffect } from 'react';

export default function AppError({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-lufga" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <svg className="w-8 h-8" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h1>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-muted)' }}>An unexpected error occurred. Please try again.</p>
        <button onClick={reset}
          className="h-11 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200"
          style={{ backgroundColor: 'var(--ngv-active-bg)' }}>
          Try Again
        </button>
      </div>
    </div>
  );
}
