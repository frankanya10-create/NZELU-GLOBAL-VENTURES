'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { installationsAPI, customersAPI } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { HiOutlinePlus, HiOutlineWrench } from 'react-icons/hi2';

export default function InstallationsPage() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customer: '', description: '', scheduledDate: new Date().toISOString().split('T')[0], location: { address: '' }, installers: [{ name: '', phone: '', role: 'assistant' }] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadInstallations(); }, []);

  const loadInstallations = async () => {
    try { const res = await installationsAPI.list(); setInstallations(res.data.data); }
    catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.description) { toast.error('Description required.'); return; }
    setSaving(true);
    try {
      await installationsAPI.create(form);
      toast.success('Installation job created.');
      setShowModal(false);
      loadInstallations();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const columns = [
    { header: 'Job Code', render: (row) => <span className="font-mono text-sm font-medium">{row.jobCode}</span> },
    { header: 'Customer', render: (row) => row.customer?.name || '-' },
    { header: 'Description', render: (row) => <span className="truncate max-w-[200px] block">{row.description}</span> },
    { header: 'Scheduled', render: (row) => row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '—' },
    { header: 'Status', render: (row) => (
      <span className={`ngv-badge ${row.status === 'completed' ? 'ngv-badge-success' : row.status === 'in_progress' ? 'ngv-badge-info' : row.status === 'cancelled' ? 'ngv-badge-danger' : 'ngv-badge-warning'}`}>
        {row.status?.replace('_', ' ')}
      </span>
    )},
    { header: 'Installers', render: (row) => row.installers?.map(i => i.name).join(', ') || '—' },
  ];

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-surface-800">Installation Jobs</h2>
          <p className="text-sm text-surface-500">Field operations management</p>
        </div>
        <button onClick={() => setShowModal(true)} className="ngv-btn-primary"><HiOutlinePlus className="w-5 h-5 mr-1.5" /> New Job</button>
      </div>
      <div className="ngv-card overflow-hidden">
        <DataTable columns={columns} data={installations} loading={loading} emptyMessage="No installation jobs." />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Installation Job" size="lg">
        <div className="space-y-4">
          <div><label className="ngv-label">Description *</label><input type="text" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="ngv-input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="ngv-label">Scheduled Date</label><input type="date" value={form.scheduledDate} onChange={(e) => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Location Address</label><input type="text" value={form.location.address} onChange={(e) => setForm(f => ({ ...f, location: { ...f.location, address: e.target.value } }))} className="ngv-input" /></div>
          </div>
          <div><h4 className="font-medium text-sm mb-2">Installers</h4>{form.installers.map((inst, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input type="text" value={inst.name} onChange={(e) => { const upd = [...form.installers]; upd[i].name = e.target.value; setForm(f => ({ ...f, installers: upd })); }} className="ngv-input text-sm" placeholder="Name" />
              <input type="text" value={inst.phone} onChange={(e) => { const upd = [...form.installers]; upd[i].phone = e.target.value; setForm(f => ({ ...f, installers: upd })); }} className="ngv-input text-sm" placeholder="Phone" />
              <button onClick={() => { if (form.installers.length > 1) setForm(f => ({ ...f, installers: f.installers.filter((_, idx) => idx !== i) })); }} className="text-red-500 text-sm">Remove</button>
            </div>
          ))}<button onClick={() => setForm(f => ({ ...f, installers: [...f.installers, { name: '', phone: '', role: 'assistant' }] }))} className="text-sm text-ngv-700 font-medium">+ Add Installer</button></div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Creating...' : 'Create Job'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
