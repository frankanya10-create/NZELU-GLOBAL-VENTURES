'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { deliveriesAPI } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { HiOutlinePlus, HiOutlineTruck } from 'react-icons/hi2';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ invoice: '', deliveryAddress: '', driver: { name: '', phone: '', vehicle: '' }, dispatchDate: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadDeliveries(); }, []);

  const loadDeliveries = async () => {
    try { const res = await deliveriesAPI.list(); setDeliveries(res.data.data); }
    catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.deliveryAddress || !form.driver.name) { toast.error('Delivery address and driver name required.'); return; }
    setSaving(true);
    try {
      await deliveriesAPI.create(form);
      toast.success('Delivery created.');
      setShowModal(false);
      loadDeliveries();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const columns = [
    { header: 'Code', render: (row) => <span className="font-mono text-sm">{row.deliveryCode}</span> },
    { header: 'Invoice', render: (row) => row.invoice?.invoiceCode || '-' },
    { header: 'Customer', render: (row) => row.customer?.name || '-' },
    { header: 'Driver', render: (row) => row.driver?.name || '-' },
    { header: 'Vehicle', render: (row) => row.driver?.vehicle || '-' },
    { header: 'Address', render: (row) => <span className="truncate max-w-[150px] block">{row.deliveryAddress}</span> },
    { header: 'Status', render: (row) => (
      <span className={`ngv-badge ${row.status === 'delivered' ? 'ngv-badge-success' : row.status === 'dispatched' || row.status === 'in_transit' ? 'ngv-badge-info' : row.status === 'failed' ? 'ngv-badge-danger' : 'ngv-badge-warning'}`}>
        {row.status?.replace('_', ' ')}
      </span>
    )},
    { header: 'Dispatch', render: (row) => row.dispatchDate ? new Date(row.dispatchDate).toLocaleDateString() : '—' },
  ];

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-surface-800">Deliveries & Logistics</h2>
          <p className="text-sm text-surface-500">Driver dispatch and delivery tracking</p>
        </div>
        <button onClick={() => setShowModal(true)} className="ngv-btn-primary"><HiOutlinePlus className="w-5 h-5 mr-1.5" /> New Delivery</button>
      </div>
      <div className="ngv-card overflow-hidden">
        <DataTable columns={columns} data={deliveries} loading={loading} emptyMessage="No deliveries scheduled." />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Delivery" size="lg">
        <div className="space-y-4">
          <div><label className="ngv-label">Delivery Address *</label><input type="text" value={form.deliveryAddress} onChange={(e) => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} className="ngv-input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="ngv-label">Dispatch Date</label><input type="date" value={form.dispatchDate} onChange={(e) => setForm(f => ({ ...f, dispatchDate: e.target.value }))} className="ngv-input" /></div>
          </div>
          <div><h4 className="font-medium text-sm mb-2">Driver Details</h4><div className="grid grid-cols-3 gap-2">
            <input type="text" value={form.driver.name} onChange={(e) => setForm(f => ({ ...f, driver: { ...f.driver, name: e.target.value } }))} className="ngv-input text-sm" placeholder="Driver Name *" />
            <input type="text" value={form.driver.phone} onChange={(e) => setForm(f => ({ ...f, driver: { ...f.driver, phone: e.target.value } }))} className="ngv-input text-sm" placeholder="Phone" />
            <input type="text" value={form.driver.vehicle} onChange={(e) => setForm(f => ({ ...f, driver: { ...f.driver, vehicle: e.target.value } }))} className="ngv-input text-sm" placeholder="Vehicle" />
          </div></div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Creating...' : 'Schedule Delivery'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
