'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usersAPI, branchesAPI } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineNoSymbol } from 'react-icons/hi2';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'cashier', branch: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, branchesRes] = await Promise.all([usersAPI.list({ page, limit: 20 }), branchesAPI.list()]);
      setUsers(usersRes.data.data);
      setPagination(usersRes.data.pagination);
      setBranches(branchesRes.data.data);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', username: '', password: '', role: 'cashier', branch: branches[0]?._id || '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, username: user.username, password: '', role: user.role, branch: user.branch?._id || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.username) { toast.error('Required fields missing.'); return; }
    if (!editing && !form.password) { toast.error('Password is required for new users.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await usersAPI.update(editing._id, form);
        toast.success('User updated.');
      } else {
        await usersAPI.create(form);
        toast.success('User created.');
      }
      setShowModal(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleSuspend = async (user) => {
    if (!confirm(`Suspend ${user.name}?`)) return;
    try {
      await usersAPI.delete(user._id);
      toast.success('User suspended.');
      loadData();
    } catch (err) { toast.error('Failed to suspend.'); }
  };

  const columns = [
    { header: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { header: 'Email', render: (row) => row.email },
    { header: 'Username', render: (row) => row.username },
    { header: 'Role', render: (row) => <span className="ngv-badge-info capitalize">{row.role}</span> },
    { header: 'Branch', render: (row) => row.branch?.name || '—' },
    { header: 'Status', render: (row) => (
      <span className={`ngv-badge ${row.isSuspended ? 'ngv-badge-danger' : row.isActive ? 'ngv-badge-success' : 'ngv-badge-neutral'}`}>
        {row.isSuspended ? 'Suspended' : row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    {
      header: 'Actions', render: (row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg hover:bg-surface-100"><HiOutlinePencilSquare className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleSuspend(row); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><HiOutlineNoSymbol className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold text-surface-800">System Users</h2>
        <button onClick={openCreate} className="ngv-btn-primary"><HiOutlinePlus className="w-5 h-5 mr-1.5" /> Add User</button>
      </div>
      <div className="ngv-card overflow-hidden">
        <DataTable columns={columns} data={users} loading={loading} pagination={pagination} onPageChange={setPage} emptyMessage="No users found." />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="ngv-label">Full Name *</label><input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Email *</label><input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Username *</label><input type="text" value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Password {editing ? '(leave blank to keep)' : '*'}</label><input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Role</label><select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} className="ngv-select"><option value="administrator">Administrator</option><option value="manager">Manager</option><option value="cashier">Cashier</option><option value="storekeeper">Storekeeper</option></select></div>
            <div className="col-span-2"><label className="ngv-label">Branch</label><select value={form.branch} onChange={(e) => setForm(f => ({ ...f, branch: e.target.value }))} className="ngv-select"><option value="">No Branch</option>{branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
