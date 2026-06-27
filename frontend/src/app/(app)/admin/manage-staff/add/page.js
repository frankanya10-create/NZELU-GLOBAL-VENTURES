'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { HiOutlineClipboardDocument, HiOutlineCheck, HiOutlineEye, HiOutlineEyeSlash, HiOutlineSparkles, HiOutlineArrowLeft, HiOutlineEnvelope, HiOutlineUser, HiOutlineShieldCheck } from 'react-icons/hi2';

const roles = [
  { value: 'administrator', label: 'Administrator', desc: 'Full system access', icon: HiOutlineShieldCheck },
  { value: 'manager', label: 'Manager', desc: 'Branch & stock approvals', icon: HiOutlineUser },
  { value: 'cashier', label: 'Cashier', desc: 'POS & frontline sales', icon: HiOutlineUser },
  { value: 'storekeeper', label: 'Storekeeper', desc: 'Warehouse & inventory tracking', icon: HiOutlineUser },
];

function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '@#$!';
  const all = upper + lower + digits;
  let pw = '';
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += digits[Math.floor(Math.random() * digits.length)];
  pw += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 8; i++) pw += all[Math.floor(Math.random() * all.length)];
  return pw.split('').sort(() => Math.random() - 0.5).join('');
}

export default function AddStaffPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);
  const brandPanelRef = useRef(null);
  const formPanelRef = useRef(null);
  const formRef = useRef(null);
  const resultRef = useRef(null);
  const brandDecorRef = useRef(null);
  const animRan = useRef(false);

  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Access denied.');
      router.push('/admin/dashboard');
    }
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
    if (formRef.current) {
      gsap.set(formRef.current.querySelectorAll('.field-group'), { opacity: 0, y: 14 });
      gsap.to(formRef.current.querySelectorAll('.field-group'), { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.2, clearProps: 'opacity,transform' });
    }
  }, []);

  useEffect(() => {
    if (created && resultRef.current) {
      gsap.set(resultRef.current, { opacity: 0, y: 20, scale: 0.96 });
      gsap.to(resultRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', clearProps: 'opacity,transform' });
    }
  }, [created]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleGenerate = () => {
    const pw = generatePassword();
    update('password', pw);
    toast.success('Password generated.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.role) {
      toast.error('All fields are required.'); return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.'); return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      setCreated(res.data.user);
      toast.success(`${res.data.user.name} created as ${roles.find(r => r.value === form.role)?.label}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Staff creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!created) return;
    const text = `NGV ERP Login\nName: ${created.name}\nEmail: ${created.email}\nUsername: ${created.username}\nPassword: ${created.tempPassword}\nRole: ${roles.find(r => r.value === created.role)?.label}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Credentials copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-start justify-center p-3 sm:p-8 font-lufga" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-[960px] flex flex-col lg:flex-row rounded-3xl overflow-hidden min-h-[580px]" style={{ backgroundColor: 'var(--bg-secondary)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-primary)' }}>
        {/* Brand Panel */}
        <div ref={brandPanelRef} className="hidden lg:flex w-[380px] bg-ngv-900 relative flex-col justify-between p-10 shrink-0">
          <div ref={brandDecorRef} className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="decor-circle absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full" />
            <div className="decor-circle absolute top-1/3 -left-16 w-48 h-48 bg-white rounded-full" />
            <div className="decor-circle absolute -bottom-10 right-1/4 w-36 h-36 bg-white rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <img src="/logo.png" alt="NGV Logo" className="w-11 h-11 rounded-xl shadow-lg object-cover" />
              <span className="text-white font-bold text-xl tracking-tight">NGV ERP</span>
            </div>
            <h2 className="text-white text-3xl font-bold leading-tight mb-3 font-lufga" style={{ fontWeight: 900 }}>
              {created ? <>Account<br />Created</> : <>Add<br />Staff Member</>}
            </h2>
            <p className="text-ngv-200 text-sm leading-relaxed">
              {created
                ? 'Credentials have been sent to their email'
                : 'Enter their details and assign a role'}
            </p>
          </div>
          <div className="relative z-10">
            <div className="border-t border-ngv-700 pt-6">
              <p className="text-ngv-400 text-xs leading-relaxed">
                {created ? (
                  <>
                    Credentials were sent to <span className="text-white font-medium">{created.email}</span>
                  </>
                ) : (
                  'Staff will receive login credentials via email'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div ref={formPanelRef} className="flex-1 flex items-start justify-center p-5 sm:p-8 lg:p-12 relative">
          <div className="w-full max-w-sm pt-2 sm:pt-4">
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <img src="/logo.png" alt="NGV Logo" className="w-9 h-9 rounded-xl object-cover" />
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>NGV ERP</span>
            </div>

            {!created && !loading && (
              <button onClick={() => router.push('/admin/manage-staff')}
                className="flex items-center gap-1.5 text-sm mb-8 transition-colors group"
                style={{ color: 'var(--text-muted)' }}>
                <HiOutlineArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Back to staff
              </button>
            )}

            {!created ? (
              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="mb-8">
                  <h1 className="text-xl mb-1 font-lufga" style={{ color: 'var(--text-primary)', fontWeight: 900 }}>New Staff Account</h1>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fill in the details below to create an account</p>
                </div>

                <div className="space-y-4">
                  <div className="field-group relative">
                    <input type="text" id="name" value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className={`peer ngv-input h-14 pt-5 text-base transition-all duration-200 ${form.name ? 'border-ngv-600' : ''}`}
                      placeholder=" " autoComplete="name" />
                    <label htmlFor="name"
                      className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                        form.name ? 'top-1.5 text-xs text-ngv-700' : 'top-4 text-sm'
                      } peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ngv-700`}
                      style={{ color: form.name ? '' : 'var(--text-muted)' }}>
                      Full Name
                    </label>
                  </div>

                  <div className="field-group relative">
                    <input type="email" id="email" value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className={`peer ngv-input h-14 pt-5 text-base transition-all duration-200 ${form.email ? 'border-ngv-600' : ''}`}
                      placeholder=" " autoComplete="email" />
                    <label htmlFor="email"
                      className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                        form.email ? 'top-1.5 text-xs text-ngv-700' : 'top-4 text-sm'
                      } peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ngv-700`}
                      style={{ color: form.email ? '' : 'var(--text-muted)' }}>
                      Personal Email Address
                    </label>
                  </div>

                  <div className="field-group">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type={showPassword ? 'text' : 'password'} id="password" value={form.password} readOnly
                          className={`ngv-input h-12 w-full pr-10 text-sm transition-all duration-200 ${form.password ? 'border-ngv-600' : ''}`}
                          placeholder="Click Generate" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}
                          disabled={!form.password}>
                          {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button type="button" onClick={handleGenerate}
                        className="flex items-center gap-1.5 h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-95"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <HiOutlineSparkles className="w-4 h-4" />
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Assign Role</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {roles.map((r) => {
                        const selected = form.role === r.value;
                        const Icon = r.icon;
                        return (
                          <button key={r.value} type="button" onClick={() => update('role', r.value)}
                            className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                              selected ? 'ring-2 ring-ngv-600/20' : ''
                            }`}
                            style={{
                              borderColor: selected ? '#166534' : 'var(--border-secondary)',
                              backgroundColor: selected ? 'var(--ngv-active-bg)' : 'var(--bg-secondary)',
                            }}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                              selected ? 'bg-white/20' : ''
                            }`} style={{ backgroundColor: selected ? '' : 'var(--bg-tertiary)' }}>
                              <Icon className={`w-4 h-4 ${selected ? 'text-white' : ''}`} style={{ color: selected ? '' : 'var(--text-secondary)' }} />
                            </div>
                            <p className={`text-sm font-semibold ${selected ? 'text-white' : ''}`} style={{ color: selected ? '' : 'var(--text-primary)' }}>{r.label}</p>
                            <p className={`text-xs mt-0.5 ${selected ? 'text-white/70' : ''}`} style={{ color: selected ? '' : 'var(--text-muted)' }}>{r.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="field-group flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-1">
                    <button type="submit" disabled={loading || !form.password}
                      className="ngv-btn-primary h-12 rounded-2xl text-sm font-medium">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : 'Create Staff Account'}
                    </button>
                    <button type="button" onClick={() => router.push('/admin/manage-staff')}
                      className="h-12 rounded-2xl text-sm font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div ref={resultRef}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <HiOutlineShieldCheck className="w-8 h-8 text-ngv-700" />
                  </div>
                  <h1 className="text-2xl mb-1 font-lufga" style={{ color: 'var(--text-primary)', fontWeight: 900 }}>Account Created</h1>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Staff credentials have been generated</p>
                </div>

                <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="space-y-3">
                    {[
                      { label: 'Name', value: created.name },
                      { label: 'Email', value: created.email },
                      { label: 'Username', value: created.username },
                      { label: 'Password', value: created.tempPassword, highlight: true },
                      { label: 'Role', value: roles.find(r => r.value === created.role)?.label },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                        <span className={`text-sm font-semibold ${item.highlight ? 'text-ngv-700' : ''}`} style={{ color: item.highlight ? '' : 'var(--text-primary)' }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl mb-5 flex items-start gap-3" style={{ backgroundColor: '#fef3c7' }}>
                  <HiOutlineEnvelope className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    An email has been sent to <strong>{created.email}</strong> with their login credentials and role details. They can change their password from the Settings page.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button onClick={copyCredentials}
                    className="flex items-center justify-center gap-2 ngv-btn-primary h-12 rounded-2xl text-sm font-medium w-full">
                    {copied ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineClipboardDocument className="w-4 h-4" />}
                    {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
                  </button>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => { setCreated(null); setForm({ name: '', email: '', password: '', role: 'cashier' }); }}
                      className="h-11 rounded-2xl text-sm font-medium transition-colors sm:flex-1"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>
                      Add Another
                    </button>
                    <button onClick={() => router.push('/admin/manage-staff')}
                      className="h-11 rounded-2xl text-sm font-medium transition-colors sm:flex-1"
                      style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', border: '1px solid var(--border-primary)' }}>
                      Staff List
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
