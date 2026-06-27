'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineKey, HiOutlineShieldCheck } from 'react-icons/hi2';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current.querySelectorAll('.fade-item'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' });
    }
  }, []);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('All fields are required.'); return;
    }
    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.'); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match.'); return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setChanged(true);
      toast.success('Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div ref={contentRef}>
        <div className="mb-6 fade-item">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account security</p>
        </div>

        <div className="ngv-card fade-item">
          <div className="ngv-card-header flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <HiOutlineKey className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Secure your account with a new password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="relative">
              <input type={show.current ? 'text' : 'password'} id="currentPassword" value={form.currentPassword}
                onChange={(e) => update('currentPassword', e.target.value)}
                className={`peer ngv-input h-14 pt-5 pr-12 text-base transition-all duration-200 ${form.currentPassword ? 'border-ngv-600' : ''}`}
                placeholder=" " autoComplete="current-password" />
              <label htmlFor="currentPassword"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.currentPassword ? 'top-1.5 text-xs text-ngv-700' : 'top-4 text-sm'
                } peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ngv-700`}
                style={{ color: form.currentPassword ? '' : 'var(--text-muted)' }}>
                Current Password
              </label>
              <button type="button" onClick={() => setShow((p) => ({ ...p, current: !p.current }))}
                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {show.current ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input type={show.new ? 'text' : 'password'} id="newPassword" value={form.newPassword}
                onChange={(e) => update('newPassword', e.target.value)}
                className={`peer ngv-input h-14 pt-5 pr-12 text-base transition-all duration-200 ${form.newPassword ? 'border-ngv-600' : ''}`}
                placeholder=" " autoComplete="new-password" />
              <label htmlFor="newPassword"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.newPassword ? 'top-1.5 text-xs text-ngv-700' : 'top-4 text-sm'
                } peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ngv-700`}
                style={{ color: form.newPassword ? '' : 'var(--text-muted)' }}>
                New Password
              </label>
              <button type="button" onClick={() => setShow((p) => ({ ...p, new: !p.new }))}
                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {show.new ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input type={show.confirm ? 'text' : 'password'} id="confirmPassword" value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className={`peer ngv-input h-14 pt-5 pr-12 text-base transition-all duration-200 ${form.confirmPassword ? 'border-ngv-600' : ''}`}
                placeholder=" " autoComplete="new-password" />
              <label htmlFor="confirmPassword"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.confirmPassword ? 'top-1.5 text-xs text-ngv-700' : 'top-4 text-sm'
                } peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ngv-700`}
                style={{ color: form.confirmPassword ? '' : 'var(--text-muted)' }}>
                Confirm New Password
              </label>
              <button type="button" onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {show.confirm ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>

            {changed && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--ngv-active-bg)', color: 'var(--ngv-active-text)' }}>
                <HiOutlineShieldCheck className="w-5 h-5 shrink-0" />
                Password updated successfully.
              </div>
            )}

            <button type="submit" disabled={loading}
              className="ngv-btn-primary h-12 px-6 rounded-xl text-sm font-medium w-full">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </div>
              ) : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="mt-6 ngv-card fade-item">
          <div className="ngv-card-header flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <HiOutlineShieldCheck className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Account Info</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your profile details</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Name</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Email</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Role</span>
              <span className="text-sm font-medium capitalize" style={{ color: 'var(--ngv-active-bg, #166534)' }}>{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
