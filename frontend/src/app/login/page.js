'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}><div className="w-8 h-8 border-2 border-t-ngv-700 rounded-full animate-spin" style={{ borderColor: 'var(--border-secondary)', borderTopColor: '#166534' }} /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const getRoleRedirect = useAuthStore((s) => s.getRoleRedirect);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const containerRef = useRef(null);
  const brandPanelRef = useRef(null);
  const formPanelRef = useRef(null);
  const formRef = useRef(null);
  const brandDecorRef = useRef(null);
  const cardRef = useRef(null);
  const timeoutFlag = searchParams.get('timeout');
  const animRan = useRef(false);

  useEffect(() => {
    if (timeoutFlag) toast.error('Session timed out. Please login again.');
  }, []);

  useEffect(() => {
    if (animRan.current) return;
    animRan.current = true;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    if (brandPanelRef.current) {
      tl.fromTo(brandPanelRef.current, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, '-=0.15');
    }
    if (brandDecorRef.current) {
      gsap.fromTo(brandDecorRef.current.querySelectorAll('.decor-circle'),
        { scale: 0, opacity: 0, rotation: -15 },
        { scale: 1, opacity: 0.07, rotation: 0, duration: 0.9, stagger: 0.12, ease: 'elastic.out(1, 0.5)' }
      );
    }
    if (formPanelRef.current) {
      tl.fromTo(formPanelRef.current, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, '-=0.35');
    }
    if (cardRef.current) {
      gsap.set(cardRef.current, { opacity: 0, y: 20 });
      gsap.to(cardRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' });
    }
    if (formRef.current) {
      gsap.set(formRef.current, { opacity: 0, y: 18, scale: 0.99 });
      gsap.to(formRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out', clearProps: 'opacity,transform' });
      const inputs = formRef.current.querySelectorAll('input');
      gsap.set(inputs, { opacity: 0, y: 10 });
      gsap.to(inputs, { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      const redirect = getRoleRedirect();
      router.push(redirect);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center p-4 sm:p-8 font-lufga" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div ref={cardRef}
        className="w-full max-w-[1000px] flex rounded-3xl overflow-hidden min-h-[560px]"
        style={{ backgroundColor: 'var(--bg-secondary)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-primary)' }}>
        {/* Brand Panel */}
        <div ref={brandPanelRef} className="hidden lg:flex w-[420px] bg-ngv-900 relative flex-col justify-between p-10 shrink-0">
          <div ref={brandDecorRef} className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="decor-circle absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full" />
            <div className="decor-circle absolute top-1/3 -left-16 w-48 h-48 bg-white rounded-full" />
            <div className="decor-circle absolute -bottom-10 right-1/4 w-36 h-36 bg-white rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <img src="/logo.png" alt="NGV Logo" className="w-11 h-11 rounded-xl shadow-lg object-cover" />
              <span className="text-white font-bold text-xl tracking-tight">NGV</span>
            </div>
            <h2 className="text-white text-3xl font-bold leading-tight mb-3 font-lufga" style={{ fontWeight: 900 }}>Enterprise<br />Resource Planning</h2>
            <p className="text-ngv-200 text-sm leading-relaxed">
              Tarpaulins · Carpets · Centre Rugs<br />
              Artificial Grass · Tent Installations
            </p>
          </div>
          <div className="relative z-10">
            <div className="border-t border-ngv-700 pt-6">
              <div className="flex -space-x-2 mb-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-ngv-800 bg-ngv-700 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{['AE','MO','SN','KO'][i-1]}</span>
                  </div>
                ))}
              </div>
              <p className="text-ngv-400 text-xs">Trusted by industry leaders nationwide</p>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div ref={formPanelRef} className="flex-1 flex items-center justify-center p-8 sm:p-12 relative">
          <div className="absolute top-4 right-4 z-20">
            <ThemeToggle collapsed={true} />
          </div>
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <img src="/logo.png" alt="NGV Logo" className="w-9 h-9 rounded-xl object-cover" />
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>NGV ERP</span>
            </div>

            <form ref={formRef} onSubmit={handleLogin}>
              <div className="mb-8">
                <h1 className="text-2xl mb-1.5 font-lufga" style={{ color: 'var(--text-primary)', fontWeight: 900 }}>Welcome back</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your account to continue</p>
              </div>

              <div className="space-y-5">
                <div className="relative">
                  <input type="email" id="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`peer ngv-input h-14 pt-5 text-base transition-all duration-200 ${email ? 'border-ngv-600' : ''}`}
                    placeholder=" " autoComplete="email" />
                  <label htmlFor="email"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      email ? 'top-1.5 text-xs text-ngv-700' : 'top-4 text-sm'
                    } peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ngv-700`}
                    style={{ color: email ? '' : 'var(--text-muted)' }}>
                    Email address
                  </label>
                </div>

                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} id="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`peer ngv-input h-14 pt-5 pr-12 text-base transition-all duration-200 ${password ? 'border-ngv-600' : ''}`}
                    placeholder=" " autoComplete="current-password" />
                  <label htmlFor="password"
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      password ? 'top-1.5 text-xs text-ngv-700' : 'top-4 text-sm'
                    } peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ngv-700`}
                    style={{ color: password ? '' : 'var(--text-muted)' }}>
                    Password
                  </label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                      remember ? 'bg-ngv-700 border-ngv-700' : 'group-hover:border-ngv-400'
                    }`} style={{ borderColor: remember ? '' : 'var(--border-secondary)' }}>
                      {remember && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only" />
                    <span className="text-sm select-none" style={{ color: 'var(--text-secondary)' }}>Remember me</span>
                  </label>
                </div>

                <button type="submit" disabled={loading}
                  className="ngv-btn-primary w-full h-13 text-base rounded-2xl relative overflow-hidden group">
                  <span className={`relative z-10 flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
                    Sign In
                  </span>
                  {loading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  )}
                </button>
              </div>

              <p className="text-center text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
                Authorized personnel only. Contact your administrator for access.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
