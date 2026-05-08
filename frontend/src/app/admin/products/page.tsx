'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn, generateSlug } from '@/lib/utils';
import { Plus, Edit, Trash2, Package, Search, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

interface VariantData { id?: string; sku: string; size: string; color: string; colorHex?: string; price: number; mrp: number; stock: number; isActive?: boolean; }
interface ProductData {
  id: string; name: string; slug: string; description: string; images: string[];
  isActive: boolean; isFeatured: boolean; exportBadge: boolean; tags: string[];
  categoryId: string; category?: { name: string; slug: string };
  variants: VariantData[];
}
interface CategoryOption { id: string; name: string; slug: string; children?: CategoryOption[] }

const EMPTY_VARIANT: VariantData = { sku: '', size: '', color: '', colorHex: '#000000', price: 0, mrp: 0, stock: 0 };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Form state
  const [form, setForm] = useState({ name: '', slug: '', description: '', categoryId: '', images: [''], tags: '', exportBadge: false, isFeatured: false });
  const [variants, setVariants] = useState<VariantData[]>([{ ...EMPTY_VARIANT }]);
  const [formError, setFormError] = useState('');

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({ search: search || undefined, page, limit: 20 }) as any;
      setProducts(res.data || []); setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    adminApi.getCategories().then((res: any) => {
      const hierarchy: CategoryOption[] = [];
      (res.data || []).forEach((parent: any) => {
        // Add parent
        hierarchy.push(parent);
        // Add children with a prefix for visual hierarchy
        (parent.children || []).forEach((child: any) => {
          hierarchy.push({
            ...child,
            name: `${parent.name} > ${child.name}`
          });
        });
      });
      setCategories(hierarchy);
    }).catch(console.error);
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ name: '', slug: '', description: '', categoryId: '', images: [''], tags: '', exportBadge: false, isFeatured: false });
    setVariants([{ ...EMPTY_VARIANT }]);
    setFormError(''); setShowModal(true);
  };

  const openEditModal = (p: ProductData) => {
    setEditingProduct(p);
    setForm({ name: p.name, slug: p.slug, description: p.description, categoryId: p.categoryId, images: p.images.length ? p.images : [''], tags: p.tags.join(', '), exportBadge: p.exportBadge, isFeatured: p.isFeatured });
    setVariants(p.variants.map(v => ({ ...v })));
    setFormError(''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId) { setFormError('Name and category are required'); return; }
    const validVariants = variants.filter(v => v.size && v.color && v.price > 0);
    if (validVariants.length === 0) { setFormError('At least one valid variant is required'); return; }

    setSaving(true); setFormError('');
    try {
      const slug = form.slug || generateSlug(form.name);
      const data = {
        name: form.name, slug, description: form.description, categoryId: form.categoryId,
        images: form.images.filter(Boolean), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        exportBadge: form.exportBadge, isFeatured: form.isFeatured,
        variants: validVariants.map(v => ({ sku: v.sku || `${slug}-${v.size}-${v.color}`.toLowerCase().replace(/\s+/g, '-'), size: v.size, color: v.color, colorHex: v.colorHex, price: Number(v.price), mrp: Number(v.mrp), stock: Number(v.stock) })),
      };
      if (editingProduct) { await adminApi.updateProduct(editingProduct.id, data); }
      else { await adminApi.createProduct(data); }
      setShowModal(false); fetchProducts(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    try { await adminApi.deleteProduct(id); fetchProducts(pagination.page); } catch (e: any) { alert(e.message); }
  };

  const handleUpdateStock = async (variantId: string, stock: number) => {
    try {
      await adminApi.updateVariant(variantId, { stock });
      setProducts(prev => prev.map(p => ({ ...p, variants: p.variants.map(v => v.id === variantId ? { ...v, stock } : v) })));
    } catch (e) { console.error('Failed to update stock:', e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products <span className="text-base font-normal text-muted">({pagination.total})</span></h1>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Package size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No products found</p>
          <p className="text-sm text-muted">Create your first product to get started.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                  const minPrice = Math.min(...product.variants.map(v => v.price));
                  return (
                    <tr key={product.id}>
                      <td colSpan={6} className="p-0">
                        <div className="border-b border-border hover:bg-surface/50 cursor-pointer flex items-center" onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}>
                          <div className="px-4 py-3 flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-12 bg-surface rounded-lg overflow-hidden shrink-0">
                              <img src={product.images?.[0] || 'https://placehold.co/80x96/f5f5f5/E8007A?text=P'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                              <p className="text-xs text-muted">{product.variants.length} variants</p>
                            </div>
                          </div>
                          <div className="px-4 py-3 hidden md:block text-muted">{product.category?.name || '—'}</div>
                          <div className="px-4 py-3 text-right font-medium">{formatPrice(minPrice)}</div>
                          <div className="px-4 py-3 text-right">
                            <span className={cn('font-medium', totalStock <= 5 ? 'text-error' : totalStock <= 20 ? 'text-warning' : 'text-success')}>{totalStock}</span>
                          </div>
                          <div className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${product.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="px-4 py-3 text-right flex items-center justify-end gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(product); }} className="p-1.5 hover:bg-surface rounded-lg transition-colors"><Edit size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} className="p-1.5 hover:bg-error/10 text-error/60 hover:text-error rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {expandedProduct === product.id && (
                          <div className="bg-surface/30">
                            {product.variants.map(v => (
                              <div key={v.id} className="flex items-center border-b border-border text-xs px-4 py-2">
                                <div className="pl-12 flex-1 text-muted">{v.sku}</div>
                                <div className="px-4 hidden md:block">{v.size} / {v.color}</div>
                                <div className="px-4 text-right">{formatPrice(v.price)}</div>
                                <div className="px-4 text-right">
                                  <input type="number" defaultValue={v.stock} min={0} className="w-16 px-2 py-1 border border-border rounded text-xs text-right focus:outline-none focus:border-primary"
                                    onBlur={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n !== v.stock && v.id) handleUpdateStock(v.id, n); }} />
                                </div>
                                <div className="px-4 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${v.stock > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{v.stock > 0 ? 'In Stock' : 'OOS'}</span>
                                </div>
                                <div className="px-4 w-16" />
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => fetchProducts(p)} className={cn('w-8 h-8 rounded-lg text-xs font-medium', p === pagination.page ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary')}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && <div className="p-3 bg-error/10 text-error text-sm rounded-lg">{formError}</div>}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Slug</label>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Category *</label>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted mb-2 block">Product Images *</label>
                <ImageUpload 
                  images={form.images} 
                  onChange={(urls) => setForm({ ...form, images: urls })} 
                  maxImages={6} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted mb-1 block">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex items-end gap-4 pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="accent-primary" /> Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.exportBadge} onChange={e => setForm({ ...form, exportBadge: e.target.checked })} className="accent-primary" /> Export Badge
                  </label>
                </div>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted">Variants *</label>
                  <button onClick={() => setVariants([...variants, { ...EMPTY_VARIANT }])} className="text-xs text-primary font-medium">+ Add Variant</button>
                </div>
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-6 gap-2 items-end">
                      <div><label className="text-[10px] text-muted block mb-0.5">Size</label><input value={v.size} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], size: e.target.value }; setVariants(vv); }} className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary" /></div>
                      <div><label className="text-[10px] text-muted block mb-0.5">Color</label><input value={v.color} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], color: e.target.value }; setVariants(vv); }} className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary" /></div>
                      <div><label className="text-[10px] text-muted block mb-0.5">Price</label><input type="number" value={v.price} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], price: Number(e.target.value) }; setVariants(vv); }} className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary" /></div>
                      <div><label className="text-[10px] text-muted block mb-0.5">MRP</label><input type="number" value={v.mrp} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], mrp: Number(e.target.value) }; setVariants(vv); }} className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary" /></div>
                      <div><label className="text-[10px] text-muted block mb-0.5">Stock</label><input type="number" value={v.stock} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], stock: Number(e.target.value) }; setVariants(vv); }} className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary" /></div>
                      <div>{variants.length > 1 && <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="p-1.5 text-error hover:bg-error/10 rounded"><X size={12} /></button>}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-surface">Cancel</button>
              <button onClick={handleSave} disabled={saving} className={cn('px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium', saving ? 'opacity-60' : 'hover:bg-primary-dark')}>
                {saving ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}{editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
