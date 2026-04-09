'use client';

import { useEffect, useState } from 'react';
import { productApi, adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Plus, Edit, Package, Search } from 'lucide-react';

interface ProductData {
  id: string; name: string; slug: string; images: string[];
  isActive: boolean; isFeatured: boolean; exportBadge: boolean;
  category?: { name: string };
  variants: { id: string; sku: string; size: string; color: string; price: number; mrp: number; stock: number; isActive: boolean }[];
  minPrice: number; totalStock: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  useEffect(() => {
    productApi.list({ limit: 50, search: search || undefined })
      .then((res: unknown) => { const r = res as { data: ProductData[] }; setProducts(r.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  const handleUpdateStock = async (variantId: string, stock: number) => {
    try {
      await adminApi.updateVariant(variantId, { stock });
      // Refresh (in production, optimistic update)
      setProducts(prev => prev.map(p => ({
        ...p,
        variants: p.variants.map(v => v.id === variantId ? { ...v, stock } : v),
      })));
    } catch (e) { console.error('Failed to update stock:', e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}</div>
      ) : (
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
              {products.map(product => (
                <>
                  <tr key={product.id} className="border-b border-border hover:bg-surface/50 cursor-pointer" onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-surface rounded-lg overflow-hidden shrink-0">
                          <img src={product.images?.[0] || 'https://placehold.co/80x96/f5f5f5/E8007A?text=P'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-muted">{product.variants.length} variants</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(product.minPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('font-medium', product.totalStock <= 5 ? 'text-error' : product.totalStock <= 20 ? 'text-warning' : 'text-success')}>
                        {product.totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${product.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 hover:bg-surface rounded-lg transition-colors"><Edit size={14} /></button>
                    </td>
                  </tr>
                  {/* Expanded variant rows */}
                  {expandedProduct === product.id && product.variants.map(v => (
                    <tr key={v.id} className="bg-surface/30 border-b border-border text-xs">
                      <td className="pl-16 pr-4 py-2">
                        <span className="text-muted">{v.sku}</span>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        {v.size} / {v.color}
                      </td>
                      <td className="px-4 py-2 text-right">{formatPrice(v.price)}</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          defaultValue={v.stock}
                          min={0}
                          className="w-16 px-2 py-1 border border-border rounded text-xs text-right focus:outline-none focus:border-primary"
                          onBlur={(e) => {
                            const newStock = parseInt(e.target.value);
                            if (!isNaN(newStock) && newStock !== v.stock) handleUpdateStock(v.id, newStock);
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${v.stock > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {v.stock > 0 ? 'In Stock' : 'OOS'}
                        </span>
                      </td>
                      <td className="px-4 py-2" />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
