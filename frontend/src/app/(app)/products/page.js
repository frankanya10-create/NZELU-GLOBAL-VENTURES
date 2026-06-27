'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { productsAPI, rollsAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { HiOutlinePlus, HiOutlinePencilSquare } from 'react-icons/hi2';

export default function ProductsPage() {
  const user = useAuthStore((s) => s.user);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showRollModal, setShowRollModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rollData, setRollData] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'tarpaulin', unit: 'meters', sku: '' });
  const [prices, setPrices] = useState({ cost: 0, selling: 0, minimumSelling: 0, wholesale: 0, retail: 0 });
  const [rollForm, setRollForm] = useState({ rollId: '', initialBalance: 0, unit: 'meters', supplier: '' });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'administrator';
  const isCashierStorekeeper = ['cashier', 'storekeeper'].includes(user?.role);

  useEffect(() => { loadProducts(); }, [page]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        const el = document.querySelector('.modal-form');
        if (el) gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
      }, 50);
    }
  }, [showModal]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.list({ page, limit: 20 });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load products.'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: 'tarpaulin', unit: 'meters', sku: '' });
    setPrices({ cost: 0, selling: 0, minimumSelling: 0, wholesale: 0, retail: 0 });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ name: product.name, description: product.description || '', category: product.category, unit: product.unit, sku: product.sku || '' });
    setPrices(product.prices || { cost: 0, selling: 0, minimumSelling: 0, wholesale: 0, retail: 0 });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Product name is required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, prices };
      if (editing) {
        await productsAPI.update(editing._id, payload);
        toast.success('Product updated.');
      } else {
        await productsAPI.create(payload);
        toast.success('Product created.');
      }
      setShowModal(false);
      loadProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const openAddRoll = async (product) => {
    setRollData(product);
    setRollForm({ rollId: '', initialBalance: 0, unit: product.unit || 'meters', supplier: '' });
    setShowRollModal(true);
  };

  const handleAddRoll = async () => {
    if (!rollForm.rollId || rollForm.initialBalance <= 0) { toast.error('Roll ID and initial balance required.'); return; }
    setSaving(true);
    try {
      await rollsAPI.create({ ...rollForm, product: rollData._id, branch: user.branch });
      toast.success('Roll added.');
      setShowRollModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add roll.'); }
    finally { setSaving(false); }
  };

  const columns = [
    { header: 'Name', render: (row) => <span className="font-medium text-surface-800">{row.name}</span> },
    { header: 'SKU', render: (row) => <span className="text-xs font-mono text-surface-500">{row.sku || '—'}</span> },
    { header: 'Category', render: (row) => <span className="ngv-badge-neutral capitalize">{row.category?.replace('_', ' ')}</span> },
    { header: 'Unit', render: (row) => row.unit },
    ...(isCashierStorekeeper ? [] : [
      { header: 'Selling Price', render: (row) => `₦${row.prices?.selling?.toLocaleString() || '0'}` },
      { header: 'Cost Price', render: (row) => isAdmin ? `₦${row.prices?.cost?.toLocaleString() || '0'}` : '—' },
    ]),
    { header: 'Stock', render: (row) => (
      <span className={row.stock <= row.minStockLevel ? 'text-red-600 font-semibold' : ''}>
        {row.stock ?? 0} {row.unit}
      </span>
    )},
    { header: 'Roll Tracking', render: (row) => row.hasRollTracking ? <span className="ngv-badge-success">Yes</span> : <span className="ngv-badge-neutral">No</span> },
    ...(!isCashierStorekeeper ? [{
      header: 'Actions', render: (row) => (
        <div className="flex items-center gap-1">
          {isAdmin && <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500"><HiOutlinePencilSquare className="w-4 h-4" /></button>}
          {isAdmin && <button onClick={(e) => { e.stopPropagation(); openAddRoll(row); }} className="p-1.5 rounded-lg hover:bg-ngv-50 text-ngv-600 text-xs font-medium">+Roll</button>}
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <select className="ngv-select w-40" onChange={(e) => { }}>
            <option value="">All Categories</option>
            <option value="tarpaulin">Tarpaulin</option>
            <option value="carpet">Carpet</option>
            <option value="centre_rug">Centre Rug</option>
            <option value="artificial_grass">Artificial Grass</option>
            <option value="tent">Tent</option>
            <option value="accessory">Accessory</option>
          </select>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="ngv-btn-primary">
            <HiOutlinePlus className="w-5 h-5 mr-1.5" /> Add Product
          </button>
        )}
      </div>

      <div className="ngv-card overflow-hidden">
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No products found."
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="modal-form space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="ngv-label">Product Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="ngv-input" />
            </div>
            <div>
              <label className="ngv-label">SKU</label>
              <input type="text" value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} className="ngv-input" />
            </div>
            <div>
              <label className="ngv-label">Category</label>
              <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="ngv-select">
                <option value="tarpaulin">Tarpaulin</option>
                <option value="carpet">Carpet</option>
                <option value="centre_rug">Centre Rug</option>
                <option value="artificial_grass">Artificial Grass</option>
                <option value="tent">Tent</option>
                <option value="accessory">Accessory</option>
              </select>
            </div>
            <div>
              <label className="ngv-label">Unit</label>
              <select value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} className="ngv-select">
                <option value="meters">Meters</option>
                <option value="yards">Yards</option>
                <option value="sqm">Square Meters</option>
                <option value="pcs">Pieces</option>
                <option value="rolls">Rolls</option>
                <option value="sets">Sets</option>
              </select>
            </div>
          </div>
          <div>
            <label className="ngv-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="ngv-input resize-none" rows={2} />
          </div>

          {isAdmin && (
            <div>
              <h4 className="font-medium text-surface-800 mb-3">Price Brackets</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="ngv-label text-xs">Cost Price</label>
                  <input type="number" value={prices.cost} onChange={(e) => setPrices(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} className="ngv-input" />
                </div>
                <div>
                  <label className="ngv-label text-xs">Selling</label>
                  <input type="number" value={prices.selling} onChange={(e) => setPrices(p => ({ ...p, selling: parseFloat(e.target.value) || 0 }))} className="ngv-input" />
                </div>
                <div>
                  <label className="ngv-label text-xs">Min Selling</label>
                  <input type="number" value={prices.minimumSelling} onChange={(e) => setPrices(p => ({ ...p, minimumSelling: parseFloat(e.target.value) || 0 }))} className="ngv-input" />
                </div>
                <div>
                  <label className="ngv-label text-xs">Wholesale</label>
                  <input type="number" value={prices.wholesale} onChange={(e) => setPrices(p => ({ ...p, wholesale: parseFloat(e.target.value) || 0 }))} className="ngv-input" />
                </div>
                <div>
                  <label className="ngv-label text-xs">Retail</label>
                  <input type="number" value={prices.retail} onChange={(e) => setPrices(p => ({ ...p, retail: parseFloat(e.target.value) || 0 }))} className="ngv-input" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRollModal} onClose={() => setShowRollModal(false)} title={`Add Roll - ${rollData?.name || ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="ngv-label">Roll ID *</label>
            <input type="text" value={rollForm.rollId} onChange={(e) => setRollForm(f => ({ ...f, rollId: e.target.value }))} className="ngv-input" placeholder="e.g. TARP-001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ngv-label">Initial Balance *</label>
              <input type="number" value={rollForm.initialBalance} onChange={(e) => setRollForm(f => ({ ...f, initialBalance: parseFloat(e.target.value) || 0 }))} className="ngv-input" />
            </div>
            <div>
              <label className="ngv-label">Unit</label>
              <select value={rollForm.unit} onChange={(e) => setRollForm(f => ({ ...f, unit: e.target.value }))} className="ngv-select">
                <option value="meters">Meters</option>
                <option value="yards">Yards</option>
                <option value="sqm">Sqm</option>
              </select>
            </div>
          </div>
          <div>
            <label className="ngv-label">Supplier</label>
            <input type="text" value={rollForm.supplier} onChange={(e) => setRollForm(f => ({ ...f, supplier: e.target.value }))} className="ngv-input" placeholder="Supplier name" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRollModal(false)} className="ngv-btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddRoll} disabled={saving} className="ngv-btn-primary flex-1">{saving ? 'Adding...' : 'Add Roll'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
