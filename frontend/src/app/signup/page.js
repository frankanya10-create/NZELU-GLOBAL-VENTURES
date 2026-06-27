'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 border-2 border-t-ngv-700 rounded-full animate-spin" style={{ borderColor: 'var(--border-secondary)', borderTopColor: '#166534' }} />
    </div>
  );
}
