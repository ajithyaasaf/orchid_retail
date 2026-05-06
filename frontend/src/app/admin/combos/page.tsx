'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn, generateSlug } from '@/lib/utils';
import { Plus, Edit, Trash2, Package, Search, X, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

interface ComboProduct {
  id: string;
  productId: string;
  product: {
    name: string;
    images: string[];
    variants: { price: number; mrp: number }[];
  };
}

interface ComboData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  mrp: number;
  isActive: boolean;
  isFeatured: boolean;
  products: ComboProduct[];
}

interface ProductOption {
  id: string;
  name: string;
  images: string[];
  variants: { price: number; mrp: number }[];
}

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<ComboData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboData | null>(null);

  // Product Selection State
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    images: [''],
    price: 0,
    mrp: 0,
    isFeatured: false,
  });
  const [formError, setFormError] = useState('');

  const fetchCombos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCombos({ search: search || undefined }) as any;
      setCombos(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [search]);

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const res = await adminApi.getProducts({ search: productSearch || undefined, limit: 10 }) as any;
      setAvailableProducts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [productSearch]);

  useEffect(() => { fetchCombos(); }, [fetchCombos]);
  useEffect(() => { if (showModal) fetchAvailableProducts(); }, [showModal, fetchAvailableProducts]);

  const openCreateModal = () => {
    setEditingCombo(null);
    setForm({ name: '', slug: '', description: '', images: [''], price: 0, mrp: 0, isFeatured: false });
    setSelectedProductIds([]);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (c: ComboData) => {
    setEditingCombo(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description,
      images: c.images.length ? c.images : [''],
      price: c.price,
      mrp: c.mrp,
      isFeatured: c.isFeatured,
    });
    setSelectedProductIds(c.products.map(p => p.productId));
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || selectedProductIds.length === 0) {
      setFormError('Name, Price, and at least one product are required');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const data = {
        ...form,
        slug: form.slug || generateSlug(form.name),
        images: form.images.filter(Boolean),
        productIds: selectedProductIds,
      };

      if (editingCombo) {
        await adminApi.updateCombo(editingCombo.id, data);
      } else {
        await adminApi.createCombo(data);
      }
      setShowModal(false);
      fetchCombos();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save combo');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this combo?')) return;
    try {
      await adminApi.deleteCombo(id);
      fetchCombos();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateAutoMRP = () => {
    // This is just a helper to sum up the individual product MRPs
    // In a real scenario, we'd need to fetch the full product data for selected IDs
    // For now, we'll let the admin set it manually or provide a button
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Combo Deals <span className="text-base font-normal text-muted">({combos.length})</span></h1>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Create Combo
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input 
          type="text" 
          placeholder="Search combos..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary" 
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : combos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Package size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No combos found</p>
          <p className="text-sm text-muted">Create your first bundle deal to boost sales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map(combo => (
            <div key={combo.id} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden group hover:shadow-md transition-all">
              <div className="relative h-48 bg-surface">
                <img src={combo.images?.[0] || 'https://placehold.co/600x400?text=Combo'} alt={combo.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => openEditModal(combo)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-foreground hover:bg-white transition-colors shadow-sm"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(combo.id)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-error hover:bg-white transition-colors shadow-sm"><Trash2 size={14} /></button>
                </div>
                {combo.isFeatured && <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-wider shadow-sm">Featured</div>}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-foreground truncate">{combo.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-primary">{formatPrice(combo.price)}</span>
                    <span className="text-xs text-muted line-through">{formatPrice(combo.mrp)}</span>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                      SAVE {Math.round((1 - combo.price / combo.mrp) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
                    <LinkIcon size={10} /> Included Products
                  </p>
                  <div className="flex -space-x-2 overflow-hidden">
                    {combo.products.map((cp, i) => (
                      <div key={cp.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-surface" title={cp.product.name}>
                        <img src={cp.product.images?.[0]} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-2 truncate">{combo.products.map(cp => cp.product.name).join(', ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Combo Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingCombo ? 'Edit Combo' : 'Create New Combo'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface rounded-lg"><X size={18} /></button>
            </div>
            
            {/* Responsive Layout: Stack on mobile, side-by-side on md+ */}
            <div className="flex flex-col md:flex-row md:h-[70vh]">
              {/* Left Column: General Info */}
              <div className="p-6 space-y-4 overflow-y-auto md:w-1/2 md:border-r border-b md:border-b-0 border-border">
                {formError && <div className="p-3 bg-error/10 text-error text-sm rounded-lg">{formError}</div>}
                
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Combo Name *</label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" 
                    placeholder="e.g. Newborn Essentials Pack of 5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">Bundle Price *</label>
                    <input 
                      type="number" 
                      value={form.price} 
                      onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary font-bold text-primary" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">Original MRP Sum</label>
                    <input 
                      type="number" 
                      value={form.mrp} 
                      onChange={e => setForm({ ...form, mrp: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary line-through text-muted" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Description</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    rows={3}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none" 
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Combo Image URL</label>
                  {form.images.map((img, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input 
                        value={img} 
                        onChange={e => { const imgs = [...form.images]; imgs[i] = e.target.value; setForm({ ...form, images: imgs }); }}
                        placeholder="https://..." 
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" 
                      />
                      {form.images.length > 1 && <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="text-error p-1"><X size={14} /></button>}
                    </div>
                  ))}
                  <button onClick={() => setForm({ ...form, images: [...form.images, ''] })} className="text-xs text-primary font-medium">+ Add Image URL</button>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="accent-primary" /> Featured in Store
                  </label>
                </div>
              </div>

              {/* Right Column: Product Selection */}
              <div className="p-6 flex flex-col md:w-1/2 bg-surface/30 min-h-[400px] md:min-h-0">
                <label className="text-xs font-medium text-muted mb-3 block">Select Products for Bundle ({selectedProductIds.length})</label>
                
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search products to add..." 
                    value={productSearch} 
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs focus:outline-none focus:border-primary bg-white" 
                  />
                </div>

                <div className="overflow-y-auto space-y-2 flex-1 max-h-60 md:max-h-none pr-1">
                  {availableProducts.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer",
                        selectedProductIds.includes(product.id) 
                          ? "bg-primary/5 border-primary shadow-sm" 
                          : "bg-white border-border hover:border-primary/50"
                      )}
                    >
                      <div className="w-10 h-12 rounded-lg bg-surface overflow-hidden shrink-0">
                        <img src={product.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{product.name}</p>
                        <p className="text-[10px] text-muted">{formatPrice(Math.min(...product.variants.map(v => v.price)))}</p>
                      </div>
                      {selectedProductIds.includes(product.id) && <CheckCircle2 size={16} className="text-primary" />}
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-4 border-t border-border">
                  <button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className={cn('w-full py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all', saving ? 'opacity-60' : 'hover:bg-primary-dark active:scale-[0.98]')}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                    {editingCombo ? 'Update Bundle Deal' : 'Launch Bundle Deal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
