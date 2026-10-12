'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn, generateSlug } from '@/lib/utils';
import { Plus, Edit, Trash2, Package, Search, X, ChevronDown, ChevronUp, Loader2, Copy, Sparkles } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import CategorySelect, { CategoryItem } from '@/components/admin/CategorySelect';

interface VariantData { 
  id?: string; 
  sku: string; 
  size: string; 
  color: string; 
  colorHex?: string; 
  price: number | ''; 
  mrp: number | ''; 
  stock: number | ''; 
  imageIndex?: number; 
  isActive?: boolean; 
}

interface ProductData {
  id: string; 
  name: string; 
  slug: string; 
  description: string; 
  images: string[];
  isActive: boolean; 
  isFeatured: boolean; 
  exportBadge: boolean; 
  freeShipping: boolean; 
  tags: string[];
  categoryId: string; 
  category?: { name: string; slug: string };
  variants: VariantData[];
}

const EMPTY_VARIANT: VariantData = { 
  sku: '', 
  size: '', 
  color: '', 
  colorHex: '', 
  price: '', 
  mrp: '', 
  stock: '', 
  imageIndex: 0 
};

const QUICK_SIZE_PILLS = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'Free Size'];
const KIDS_SIZES = ['0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '7-8Y'];
const ALL_COMMON_SIZES = [
  'Free Size', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL',
  '0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y',
  '28', '30', '32', '34', '36', '38', '40'
];
const COMMON_COLORS = [
  'Black', 'White', 'Red', 'Blue', 'Navy Blue', 'Green', 'Olive Green', 
  'Yellow', 'Pink', 'Baby Pink', 'Purple', 'Maroon', 'Beige', 'Grey', 'Orange', 'Peach', 'Multicolor'
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Form state
  const [form, setForm] = useState({ 
    name: '', 
    slug: '', 
    description: '', 
    categoryId: '', 
    images: [] as string[], 
    tags: '', 
    exportBadge: false, 
    isFeatured: false, 
    freeShipping: false 
  });
  const [variants, setVariants] = useState<VariantData[]>([{ ...EMPTY_VARIANT }]);
  const [formError, setFormError] = useState('');

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({ search: search || undefined, page, limit: 20 }) as any;
      setProducts(res.data || []); 
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { 
    fetchProducts(); 
  }, [fetchProducts]);

  useEffect(() => {
    adminApi.getCategories().then((res: any) => {
      setCategories(res.data || []);
    }).catch(console.error);
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ 
      name: '', 
      slug: '', 
      description: '', 
      categoryId: '', 
      images: [] as string[], 
      tags: '', 
      exportBadge: false, 
      isFeatured: false, 
      freeShipping: false 
    });
    setVariants([{ ...EMPTY_VARIANT }]);
    setFormError(''); 
    setShowModal(true);
  };

  const openEditModal = (p: ProductData) => {
    setEditingProduct(p);
    setForm({ 
      name: p.name, 
      slug: p.slug, 
      description: p.description, 
      categoryId: p.categoryId, 
      images: p.images.length ? p.images : [] as string[], 
      tags: p.tags.join(', '), 
      exportBadge: p.exportBadge, 
      isFeatured: p.isFeatured, 
      freeShipping: !!p.freeShipping 
    });
    setVariants(p.variants.map(v => ({ 
      ...v,
      price: v.price ?? '',
      mrp: v.mrp ?? '',
      stock: v.stock ?? '',
      imageIndex: v.imageIndex ?? 0
    })));
    setFormError(''); 
    setShowModal(true);
  };

  const handleAddOrApplySize = (size: string) => {
    setVariants(prev => {
      const last = prev[prev.length - 1];
      if (prev.length === 1 && !prev[0].size?.trim()) {
        return [{ ...prev[0], size }];
      }
      if (last && !last.size?.trim()) {
        const copy = [...prev];
        copy[copy.length - 1] = { ...last, size };
        return copy;
      }
      if (prev.some(v => v.size.toLowerCase() === size.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          ...EMPTY_VARIANT,
          size,
          color: last?.color || '',
          colorHex: last?.colorHex || '',
          price: last?.price ?? '',
          mrp: last?.mrp ?? '',
          stock: last?.stock ?? '',
          imageIndex: last?.imageIndex ?? 0,
        }
      ];
    });
  };

  const handleAddSizePack = (packSizes: string[]) => {
    setVariants(prev => {
      const base = prev[0] || EMPTY_VARIANT;
      const existingSizes = new Set(prev.map(v => v.size.trim().toLowerCase()).filter(Boolean));
      const toAdd = packSizes.filter(s => !existingSizes.has(s.toLowerCase()));
      if (toAdd.length === 0) return prev;

      let result = [...prev];
      let startIdx = 0;

      if (result.length === 1 && !result[0].size?.trim()) {
        result[0] = { ...result[0], size: toAdd[0] };
        startIdx = 1;
      }

      for (let i = startIdx; i < toAdd.length; i++) {
        result.push({
          ...EMPTY_VARIANT,
          size: toAdd[i],
          color: base.color || '',
          colorHex: base.colorHex || '',
          price: base.price ?? '',
          mrp: base.mrp ?? '',
          stock: base.stock ?? '',
          imageIndex: base.imageIndex ?? 0,
        });
      }
      return result;
    });
  };

  const handleDuplicateVariant = (idx: number) => {
    const target = variants[idx];
    if (!target) return;
    const newVariant: VariantData = {
      ...target,
      id: undefined,
      sku: '',
    };
    const updated = [...variants];
    updated.splice(idx + 1, 0, newVariant);
    setVariants(updated);
  };

  const handleApplyPriceToAll = () => {
    if (variants.length <= 1) return;
    const first = variants[0];
    setVariants(prev => prev.map(v => ({
      ...v,
      price: first.price,
      mrp: first.mrp,
    })));
  };

  const updateVariant = (idx: number, field: keyof VariantData, val: any) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId) { 
      setFormError('Product name and category are required.'); 
      return; 
    }
    const validVariants = variants.filter(v => v.size?.trim() && v.color?.trim() && Number(v.price) > 0);
    if (validVariants.length === 0) { 
      setFormError('At least one valid variant with size, color, and price (> 0) is required.'); 
      return; 
    }

    setSaving(true); 
    setFormError('');
    try {
      const slug = form.slug || generateSlug(form.name);
      console.log('[Admin] Saving product with variants:', variants);
      const data = {
        name: form.name, 
        slug, 
        description: form.description, 
        categoryId: form.categoryId,
        images: form.images.filter(Boolean), 
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        exportBadge: form.exportBadge, 
        isFeatured: form.isFeatured,
        variants: validVariants.map(v => ({
          id: v.id,
          sku: v.sku || `${slug}-${v.size.trim()}-${v.color.trim()}`.toLowerCase().replace(/\s+/g, '-'),
          size: v.size.trim(),
          color: v.color.trim(),
          colorHex: v.colorHex || undefined,
          price: Number(v.price) || 0,
          mrp: Number(v.mrp) || 0,
          stock: Number(v.stock) || 0,
          imageIndex: Number(v.imageIndex || 0)
        })),
      };
      if (editingProduct) { 
        await adminApi.updateProduct(editingProduct.id, data); 
      } else { 
        await adminApi.createProduct(data); 
      }
      setShowModal(false); 
      fetchProducts(pagination.page);
    } catch (e: any) { 
      setFormError(e.message || 'Failed to save product'); 
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminApi.deleteProduct(id);
      fetchProducts(pagination.page);
    } catch (e: any) { 
      alert(e.message || 'Failed to delete product'); 
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Products</h1>
          <p className="text-sm text-muted">{pagination.total} products in catalog</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search products by name or category..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" 
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"><X size={14} /></button>}
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Package className="mx-auto text-muted mb-2" size={40} />
          <p className="text-muted font-medium">No products found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border text-left text-xs text-muted font-medium uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4 hidden md:table-cell">Category</th>
                  <th className="p-4">Price Range</th>
                  <th className="p-4 hidden sm:table-cell">Total Stock</th>
                  <th className="p-4 hidden sm:table-cell">Variants</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map(p => {
                  const prices = p.variants.map(v => Number(v.price) || 0);
                  const minPrice = prices.length ? Math.min(...prices) : 0;
                  const maxPrice = prices.length ? Math.max(...prices) : 0;
                  const totalStock = p.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
                  const isExpanded = expandedProduct === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-surface/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                            {p.images[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={20} className="text-muted" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-foreground block group-hover:text-primary transition-colors">{p.name}</span>
                            <span className="text-xs text-muted block">/{p.slug}</span>
                            <div className="flex gap-1 mt-1">
                              {p.isFeatured && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Featured</span>}
                              {p.exportBadge && <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-medium">Export</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted">{p.category?.name || '—'}</td>
                      <td className="p-4 font-semibold text-foreground">
                        {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', totalStock > 10 ? 'bg-success/10 text-success' : totalStock > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-error/10 text-error')}>
                          {totalStock} in stock
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <button onClick={() => setExpandedProduct(isExpanded ? null : p.id)} className="flex items-center gap-1 text-xs text-muted hover:text-primary font-medium">
                          {p.variants.length} sizes {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(p)} className="p-1.5 text-muted hover:text-primary rounded-lg hover:bg-surface transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted hover:text-error rounded-lg hover:bg-surface transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="mt-2 text-left bg-surface/50 p-2 rounded-lg border border-border text-xs space-y-1">
                            {p.variants.map((v, i) => (
                              <div key={i} className="flex justify-between text-muted">
                                <span>{v.size} / {v.color}</span>
                                <span className="font-medium text-foreground">{formatPrice(Number(v.price) || 0)} ({v.stock} pcs)</span>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 overflow-y-auto bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <p className="text-xs text-muted">Fill in basic info, category, media, and size/color variants</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-surface rounded-lg text-muted hover:text-foreground"><X size={18} /></button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {formError && <div className="p-3 bg-error/10 text-error text-sm rounded-lg font-medium">{formError}</div>}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="e.g. Floral Cotton Summer Frock"
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Slug</label>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. floral-cotton-summer-frock"
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary font-mono text-xs" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  placeholder="Comfortable lightweight fabric, perfect for festive and casual wear..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
              </div>

              {/* Modern Category Selection */}
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 flex items-center justify-between">
                  <span>Category *</span>
                  <span className="text-[11px] text-muted">Department or Subcategory</span>
                </label>
                <CategorySelect
                  categories={categories}
                  value={form.categoryId}
                  onChange={(catId) => setForm({ ...form, categoryId: catId })}
                  hasError={!!formError && !form.categoryId}
                  placeholder="Select or search category (e.g. Frocks, T-Shirts, Newborn)..."
                />
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
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="kids, cotton, summer, frocks" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex items-end gap-5 pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="accent-primary w-4 h-4" /> Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={form.exportBadge} onChange={e => setForm({ ...form, exportBadge: e.target.checked })} className="accent-primary w-4 h-4" /> Export Badge
                  </label>
                </div>
              </div>

              {/* Variants Section */}
              <div className="border border-border rounded-xl p-4 bg-surface/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-foreground">Variants *</label>
                      <span className="text-[11px] text-muted">({variants.length} variant{variants.length > 1 ? 's' : ''})</span>
                    </div>
                    <p className="text-[11px] text-muted">Pick preset sizes or add custom variants with pricing and stock</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={handleApplyPriceToAll}
                        className="text-xs text-muted hover:text-primary px-2.5 py-1 rounded-md border border-border hover:border-primary/40 bg-white transition-colors"
                        title="Copy Price & MRP from 1st variant to all"
                      >
                        Copy Price to All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setVariants([...variants, { ...EMPTY_VARIANT }])}
                      className="text-xs text-primary font-medium hover:bg-primary/10 px-2.5 py-1 rounded-md border border-primary/30 transition-colors flex items-center gap-1 bg-white"
                    >
                      <Plus size={13} /> Add Variant
                    </button>
                  </div>
                </div>

                {/* Quick Presets Toolbar */}
                <div className="bg-white border border-border rounded-lg p-2.5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Quick Sizes:</span>
                      {QUICK_SIZE_PILLS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleAddOrApplySize(s)}
                          className="px-2 py-0.5 text-xs font-medium bg-surface hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border rounded-md transition-colors"
                          title={`Add or select ${s}`}
                        >
                          +{s}
                        </button>
                      ))}

                      {/* Kids Sizes Dropdown */}
                      <div className="relative group inline-block">
                        <button
                          type="button"
                          className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-300 rounded-md transition-colors flex items-center gap-1"
                        >
                          Kids Sizes ▾
                        </button>
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:flex group-focus-within:flex flex-wrap gap-1 p-2 bg-white border border-border rounded-lg shadow-xl z-20 w-64">
                          {KIDS_SIZES.map(k => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => handleAddOrApplySize(k)}
                              className="px-2 py-1 text-xs bg-surface hover:bg-amber-100 hover:text-amber-800 rounded border border-border"
                            >
                              +{k}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preset Packs */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAddSizePack(['S', 'M', 'L', 'XL'])}
                        className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1"
                        title="Add S, M, L, XL at once"
                      >
                        <Sparkles size={12} /> S-XL Pack
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSizePack(['1-2Y', '2-3Y', '3-4Y', '4-5Y'])}
                        className="px-2.5 py-1 text-xs font-medium bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-md transition-colors flex items-center gap-1"
                        title="Add Kids 1Y to 5Y at once"
                      >
                        <Sparkles size={12} /> Kids Pack
                      </button>
                    </div>
                  </div>
                </div>

                {/* Datalists for native browser autocomplete */}
                <datalist id="admin-size-presets">
                  {ALL_COMMON_SIZES.map(s => <option key={s} value={s} />)}
                </datalist>
                <datalist id="admin-color-presets">
                  {COMMON_COLORS.map(c => <option key={c} value={c} />)}
                </datalist>

                {/* Variants List */}
                <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                  {variants.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white border border-border rounded-xl space-y-2 hover:border-primary/30 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted pb-1.5 border-b border-border/50">
                        <span className="font-semibold text-foreground/80">Variant #{i + 1}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDuplicateVariant(i)}
                            className="text-[11px] text-muted hover:text-primary flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface transition-colors"
                            title="Duplicate this variant"
                          >
                            <Copy size={11} /> Duplicate
                          </button>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                              className="text-[11px] text-error hover:bg-error/10 p-1 rounded transition-colors"
                              title="Remove variant"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-start">
                        {/* Size */}
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-0.5">Size *</label>
                          <input
                            list="admin-size-presets"
                            value={v.size}
                            placeholder="e.g. M"
                            onChange={e => updateVariant(i, 'size', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                          />
                          {/* Mini pills under Size input */}
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {['S', 'M', 'L', 'XL', 'Free'].map(s => {
                              const targetVal = s === 'Free' ? 'Free Size' : s;
                              const isSelected = v.size === targetVal;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => updateVariant(i, 'size', targetVal)}
                                  className={cn(
                                    'text-[9px] px-1 py-0.2 rounded border transition-colors',
                                    isSelected
                                      ? 'bg-primary text-white border-primary'
                                      : 'bg-surface hover:bg-surface/80 border-border text-muted hover:text-foreground'
                                  )}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Color */}
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-0.5">Color *</label>
                          <input
                            list="admin-color-presets"
                            value={v.color}
                            placeholder="e.g. Red"
                            onChange={e => updateVariant(i, 'color', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Price */}
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-0.5">Price (₹) *</label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            value={v.price === 0 ? 0 : (v.price ?? '')}
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const val = e.target.value;
                              updateVariant(i, 'price', val === '' ? '' : Number(val));
                            }}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-bold text-primary focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* MRP */}
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-0.5">MRP (₹)</label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            value={v.mrp === 0 ? 0 : (v.mrp ?? '')}
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const val = e.target.value;
                              updateVariant(i, 'mrp', val === '' ? '' : Number(val));
                            }}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs text-muted focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Stock */}
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-0.5">Stock</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={v.stock === 0 ? 0 : (v.stock ?? '')}
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const val = e.target.value;
                              updateVariant(i, 'stock', val === '' ? '' : Number(val));
                            }}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Img # */}
                        <div>
                          <label className="text-[10px] font-semibold text-primary block mb-0.5">Img #</label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={(v.imageIndex ?? 0) + 1}
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const val = e.target.value;
                              const num = val === '' ? 0 : Math.max(0, Math.min(5, Number(val) - 1));
                              updateVariant(i, 'imageIndex', num);
                            }}
                            className="w-full px-2 py-1.5 border-2 border-primary/20 rounded-lg text-xs font-bold focus:outline-none focus:border-primary bg-primary/5 text-center"
                            title="Image index (1-6) assigned to this variant"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-border flex justify-end gap-3 bg-surface/30">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-surface">Cancel</button>
              <button onClick={handleSave} disabled={saving} className={cn('px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium', saving ? 'opacity-60' : 'hover:bg-primary-dark')}>
                {saving ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}{editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
