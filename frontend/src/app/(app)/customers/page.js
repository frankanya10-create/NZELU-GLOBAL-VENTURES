'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { customersAPI } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { HiOutlinePlus, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', telephone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCustomers(); }, [page, search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.list({ page, limit: 20, search });
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load customers.'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', telephone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({ name: customer.name, telephone: customer.telephone, email: customer.email || '', address: customer.address || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.telephone) { toast.error('Name and telephone are required.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await customersAPI.update(editing._id, form);
        toast.success('Customer updated.');
      } else {
        await customersAPI.create(form);
        toast.success('Customer created.');
      }
      setShowModal(false);
      loadCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const columns = [
    { header: 'Name', render: (row) => <span className="font-medium text-surface-800">{row.name}</span> },
    { header: 'Telephone', render: (row) => <span className="font-mono text-sm">{row.telephone}</span> },
    { header: 'Email', render: (row) => row.email || '—' },
    { header: 'Address', render: (row) => <span className="text-sm text-surface-600 truncate max-w-[200px] block">{row.address || '—'}</span> },
    { header: 'Total Purchases', render: (row) => `₦${(row.totalPurchases || 0).toLocaleString()}` },
    { header: 'Credit Balance', render: (row) => (
      <span className={row.creditBalance > 0 ? 'text-red-600 font-semibold' : ''}>
        ₦{(row.creditBalance || 0).toLocaleString()}
      </span>
    )},
    { header: 'Last Purchase', render: (row) => row.lastPurchaseDate ? new Date(row.lastPurchaseDate).toLocaleDateString() : '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers..."
            className="ngv-input pl-10"
          />
        </div>
        <button onClick={openCreate} className="ngv-btn-primary">
          <HiOutlinePlus className="w-5 h-5 mr-1.5" /> Add Customer
        </button>
      </div>

      <div className="ngv-card overflow-hidden">
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onRowClick={(row) => openEdit(row)}
          emptyMessage="No customers found."
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="ngv-label">Customer Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="ngv-input" />
            </div>
            <div>
              <label className="ngv-label">Telephone *</label>
              <input type="text" value={form.telephone} onChange={(e) => setForm(f => ({ ...f, telephone: e.target.value }))} className="ngv-input" />
            </div>
            <div>
              <label className="ngv-label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="ngv-input" />
            </div>
            <div className="col-span-2">
              <label className="ngv-label">Address</label>
              <textarea value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} className="ngv-input resize-none" rows={2} />
            </div>
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
