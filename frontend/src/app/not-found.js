import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-lufga" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-muted)' }}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/login"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200"
          style={{ backgroundColor: 'var(--ngv-active-bg)' }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
