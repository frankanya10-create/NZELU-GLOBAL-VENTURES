'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { transfersAPI, branchesAPI, productsAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { HiOutlinePlus, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

export default function TransfersPage() {
  const user = useAuthStore((s) => s.user);
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fromBranch: '', toBranch: '', items: [{ product: '', quantity: 1, notes: '' }] });
  const [saving, setSaving] = useState(false);

  const canApprove = user?.role === 'administrator' || user?.role === 'manager';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tRes, bRes] = await Promise.all([transfersAPI.list(), branchesAPI.list()]);
      setTransfers(tRes.data.data);
      setBranches(bRes.data.data);
    } catch { toast.error('Failed to load transfers.'); }
    finally { setLoading(false); }
  };

  const createTransfer = async () => {
    if (!form.fromBranch || !form.toBranch) { toast.error('Select branches.'); return; }
    if (form.fromBranch === form.toBranch) { toast.error('Branches must differ.'); return; }
    setSaving(true);
    try {
      await transfersAPI.create(form);
      toast.success('Transfer request created.');
      setShowModal(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const approveTransfer = async (id) => {
    try { await transfersAPI.approve(id); toast.success('Transfer approved.'); loadData(); }
    catch (err) { toast.error('Failed to approve.'); }
  };

  const columns = [
    { header: 'Code', render: (row) => <span className="font-mono text-sm">{row.transferCode}</span> },
    { header: 'From', render: (row) => row.fromBranch?.name || '-' },
    { header: 'To', render: (row) => row.toBranch?.name || '-' },
    { header: 'Status', render: (row) => (
      <span className={`ngv-badge ${
        row.status === 'approved' ? 'ngv-badge-success' :
        row.status === 'completed' ? 'ngv-badge-info' :
        row.status === 'rejected' ? 'ngv-badge-danger' : 'ngv-badge-warning'
      }`}>{row.status}</span>
    )},
    { header: 'Items', render: (row) => row.items?.length || 0 },
    { header: 'Requested By', render: (row) => row.requestedBy?.name || '-' },
    { header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    ...(canApprove ? [{
      header: 'Actions', render: (row) => row.status === 'pending' ? (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); approveTransfer(row._id); }} className="p-1.5 text-ngv-600 hover:bg-ngv-50 rounded-lg"><HiOutlineCheckCircle className="w-4 h-4" /></button>
          <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><HiOutlineXCircle className="w-4 h-4" /></button>
        </div>
      ) : <span className="text-xs text-surface-400">—</span>,
    }] : []),
  ];

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold text-surface-800">Stock Transfers</h2>
        <button onClick={() => { setForm({ fromBranch: '', toBranch: '', items: [{ product: '', quantity: 1, notes: '' }] }); setShowModal(true); }} className="ngv-btn-primary">
          <HiOutlinePlus className="w-5 h-5 mr-1.5" /> New Transfer
        </button>
      </div>
      <div className="ngv-card overflow-hidden">
        <DataTable columns={columns} data={transfers} loading={loading} emptyMessage="No transfers yet." />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Transfer Request" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="ngv-label">From Branch</label><select value={form.fromBranch} onChange={(e) => setForm(f => ({ ...f, fromBranch: e.target.value }))} className="ngv-select">{branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="ngv-label">To Branch</label><select value={form.toBranch} onChange={(e) => setForm(f => ({ ...f, toBranch: e.target.value }))} className="ngv-select">{branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Items</h4>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <select value={item.product} onChange={(e) => { const newItems = [...form.items]; newItems[i].product = e.target.value; setForm(f => ({ ...f, items: newItems })); }} className="ngv-select text-sm col-span-2"><option value="">Select product</option></select>
                <input type="number" value={item.quantity} onChange={(e) => { const newItems = [...form.items]; newItems[i].quantity = parseInt(e.target.value) || 1; setForm(f => ({ ...f, items: newItems })); }} className="ngv-input text-sm" min="1" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={createTransfer} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Sending...' : 'Send Transfer Request'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
