'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { HiOutlinePlus } from 'react-icons/hi2';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: '', amount: 0, category: 'other', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadExpenses(); }, [page]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await expensesAPI.list({ page, limit: 20 });
      setExpenses(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load expenses.'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.description || form.amount <= 0) { toast.error('Description and amount required.'); return; }
    setSaving(true);
    try {
      await expensesAPI.create(form);
      toast.success('Expense recorded.');
      setShowModal(false);
      loadExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Description', render: (row) => <span className="font-medium">{row.description}</span> },
    { header: 'Category', render: (row) => <span className="ngv-badge-neutral capitalize">{row.category}</span> },
    { header: 'Amount', render: (row) => <span className="font-semibold">₦{(row.amount || 0).toLocaleString()}</span> },
    { header: 'Payment', render: (row) => <span className="capitalize">{row.paymentMethod}</span> },
    { header: 'Recorded By', render: (row) => row.recordedBy?.name || '-' },
  ];

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold text-surface-800">Expense Log</h2>
        <button onClick={() => { setForm({ description: '', amount: 0, category: 'other', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="ngv-btn-primary">
          <HiOutlinePlus className="w-5 h-5 mr-1.5" /> Log Expense
        </button>
      </div>
      <div className="ngv-card overflow-hidden">
        <DataTable columns={columns} data={expenses} loading={loading} pagination={pagination} onPageChange={setPage} emptyMessage="No expenses recorded." />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Expense" size="md">
        <div className="space-y-4">
          <div><label className="ngv-label">Description</label><input type="text" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="ngv-input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="ngv-label">Amount (₦)</label><input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="ngv-input" /></div>
            <div><label className="ngv-label">Category</label><select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="ngv-select"><option value="utilities">Utilities</option><option value="rent">Rent</option><option value="salaries">Salaries</option><option value="transport">Transport</option><option value="supplies">Supplies</option><option value="maintenance">Maintenance</option><option value="marketing">Marketing</option><option value="other">Other</option></select></div>
            <div><label className="ngv-label">Payment Method</label><select value={form.paymentMethod} onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="ngv-select"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="cheque">Cheque</option></select></div>
            <div><label className="ngv-label">Date</label><input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="ngv-input" /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Recording...' : 'Record Expense'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
