'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { branchesAPI } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import { HiOutlinePlus, HiOutlinePencilSquare } from 'react-icons/hi2';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', email: '', allowedIpRanges: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBranches(); }, []);

  const loadBranches = async () => {
    try {
      const res = await branchesAPI.list();
      setBranches(res.data.data);
    } catch { toast.error('Failed to load branches.'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null); setForm({ name: '', code: '', address: '', phone: '', email: '', allowedIpRanges: '' }); setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b); setForm({ name: b.name, code: b.code, address: b.address || '', phone: b.phone || '', email: b.email || '', allowedIpRanges: (b.allowedIpRanges || []).join(', ') }); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and code required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, allowedIpRanges: form.allowedIpRanges.split(',').map(s => s.trim()).filter(Boolean) };
      if (editing) { await branchesAPI.update(editing._id, payload); toast.success('Branch updated.'); }
      else { await branchesAPI.create(payload); toast.success('Branch created.'); }
      setShowModal(false); loadBranches();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold text-surface-800">Branches / Warehouses</h2>
        <button onClick={openCreate} className="ngv-btn-primary"><HiOutlinePlus className="w-5 h-5 mr-1.5" /> Add Branch</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map(b => (
          <div key={b._id} className="ngv-card">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-surface-900">{b.name}</h3>
                  <span className="text-xs font-mono text-surface-500">{b.code}</span>
                </div>
                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-surface-100"><HiOutlinePencilSquare className="w-4 h-4" /></button>
              </div>
              <div className="text-sm text-surface-600 space-y-1">
                {b.address && <p>{b.address}</p>}
                {b.phone && <p>{b.phone}</p>}
                {b.email && <p>{b.email}</p>}
                {b.allowedIpRanges?.length > 0 && <p className="text-xs text-surface-500 mt-2">IP Ranges: {b.allowedIpRanges.join(', ')}</p>}
              </div>
              {b.manager && <div className="mt-3 pt-3 border-t border-surface-100 text-sm"><span className="text-surface-500">Manager:</span> <span className="font-medium">{b.manager?.name || 'Unassigned'}</span></div>}
            </div>
          </div>
        ))}
        {!loading && branches.length === 0 && <p className="col-span-2 text-center text-surface-500 py-12">No branches configured.</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Branch' : 'Add Branch'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="ngv-label">Branch Name *</label><input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Branch Code *</label><input type="text" value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="ngv-input" /></div>
            <div className="col-span-2"><label className="ngv-label">Address</label><input type="text" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Email</label><input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Allowed IP Ranges (comma separated)</label><input type="text" value={form.allowedIpRanges} onChange={(e) => setForm(f => ({ ...f, allowedIpRanges: e.target.value }))} className="ngv-input" placeholder="192.168.1.0/24, 10.0.0.0/8" /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
