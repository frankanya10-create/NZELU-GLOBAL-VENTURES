'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usersAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { HiOutlinePlus, HiOutlineUser, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';
import gsap from 'gsap';

const roleBadge = {
  administrator: { label: 'Admin', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', dot: 'bg-purple-500' },
  manager: { label: 'Manager', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  cashier: { label: 'Cashier', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  storekeeper: { label: 'Storekeeper', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
};

export default function ManageStaffPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    if (currentUser?.role !== 'administrator') {
      toast.error('Access denied. Administrators only.');
      router.push('/admin/dashboard');
      return;
    }
    loadStaff();
  }, []);

  useEffect(() => {
    if (!loading && staff.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from(headerRef.current, { y: -20, opacity: 0, duration: 0.4, ease: 'power2.out' });
        gsap.from(tableRef.current?.children, {
          y: 16, opacity: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out',
        });
      });
      return () => ctx.revert();
    }
  }, [loading, staff.length]);

  const loadStaff = async () => {
    try {
      const res = await usersAPI.list();
      setStaff(res.data.data || res.data);
    } catch {
      toast.error('Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersAPI.delete(deleteTarget._id);
      toast.success(`${deleteTarget.name} removed permanently.`);
      setDeleteTarget(null);
      setStaff((prev) => prev.filter((s) => s._id !== deleteTarget._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = staff.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner text="Loading staff..." />;

  return (
    <div ref={containerRef} className="font-lufga">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Staff Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {staff.length} {staff.length === 1 ? 'member' : 'members'} on the platform
          </p>
        </div>
        <button onClick={() => router.push('/admin/manage-staff/add')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-ngv-700 hover:bg-ngv-800 transition-colors shadow-sm">
          <HiOutlinePlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Card */}
      <div className="rounded-3xl overflow-hidden" style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Search */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full h-9 pl-9 pr-8 rounded-lg text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
              }}
              onFocus={(e) => e.target.style.borderColor = '#166534'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <HiOutlineXMark className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
            {filtered.length}/{staff.length}
          </span>
        </div>

        {/* Table */}
        <div ref={tableRef}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <HiOutlineUser className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {search ? 'No staff match your search' : 'No staff members yet'}
              </p>
              {!search && (
                <button onClick={() => router.push('/admin/manage-staff/add')}
                  className="mt-3 text-sm font-semibold text-ngv-600 hover:text-ngv-700 transition-colors">
                  Add your first staff member
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {filtered.map((member) => {
                const badge = roleBadge[member.role] || roleBadge.cashier;
                const initials = member.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '?';

                return (
                  <div key={member._id}
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 transition-all duration-200"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    {/* Avatar */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: member.role === 'administrator' ? 'rgba(168,85,247,0.12)' : 'var(--bg-tertiary)',
                        color: member.role === 'administrator' ? '#a855f7' : 'var(--text-secondary)',
                      }}>
                      {initials}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {member.name}
                        </span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold shrink-0 ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs truncate max-w-[120px] sm:max-w-none" style={{ color: 'var(--text-muted)' }}>
                          {member.email}
                        </span>
                        {member.username && (
                          <>
                            <span className="text-[10px] hidden sm:inline" style={{ color: 'var(--border-primary)' }}>|</span>
                            <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                              @{member.username}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] hidden sm:inline" style={{ color: 'var(--border-primary)' }}>|</span>
                        <span className="text-xs capitalize hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                          {member.branch?.name || 'No branch'}
                        </span>
                      </div>
                    </div>
                    {/* Delete */}
                    {member._id !== currentUser?.id && (
                      <button onClick={() => setDeleteTarget(member)}
                        className="p-2 rounded-xl transition-all duration-200 hover:bg-red-50 shrink-0"
                        style={{ color: '#ef4444' }}
                        title="Remove staff">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between" style={{ borderColor: 'var(--border-primary)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {staff.length} member{staff.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['administrator', 'manager', 'cashier', 'storekeeper'].map((role) => {
              const count = staff.filter((s) => s.role === role).length;
              const b = roleBadge[role];
              return (
                <span key={role} className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${b.bg} ${b.text}`}>
                  {b.label}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-lufga">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}>
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <HiOutlineTrash className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-center mb-1" style={{ color: 'var(--text-primary)' }}>
              Remove Staff
            </h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              Permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>?
              <br />This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
