'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { productApi, categoryApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
];

interface ProductData {
  id: string;
  name: string;
  slug: string;
  images: string[];
  minPrice: number;
  minMrp: number;
  totalStock: number;
  averageRating: number;
  reviewCount: number;
  exportBadge: boolean;
  variants: { id: string; size: string; color: string; price: number; mrp: number; stock: number }[];
}

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [products, setProducts] = useState<ProductData[]>([]);
  const [category, setCategory] = useState<{ name: string; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Read filters from URL
  const currentSort = searchParams.get('sort') || 'newest';
  const currentSizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    // Reset page when filters change (unless page itself changed)
    if (!('page' in updates)) params.set('page', '1');
    router.push(`/category/${slug}?${params.toString()}`, { scroll: false });
  }, [searchParams, slug, router]);

  const toggleSize = (size: string) => {
    const next = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    updateFilters({ sizes: next.join(',') });
  };

  const clearAllFilters = () => {
    router.push(`/category/${slug}`);
  };

  // Fetch category
  useEffect(() => {
    categoryApi.getBySlug(slug)
      .then((res: unknown) => {
        const r = res as { data: { name: string; description?: string } };
        setCategory(r.data);
      })
      .catch(() => setCategory({ name: slug.replace(/-/g, ' ') }));
  }, [slug]);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number | boolean> = {
      category: slug,
      sort: currentSort,
      page: currentPage,
      limit: 20,
    };
    if (currentSizes.length) params.sizes = currentSizes.join(',');
    if (currentMinPrice) params.minPrice = currentMinPrice;
    if (currentMaxPrice) params.maxPrice = currentMaxPrice;

    productApi.list(params)
      .then((res: unknown) => {
        const r = res as { data: ProductData[]; pagination: { total: number } };
        setProducts(r.data || []);
        setTotal(r.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, currentSort, currentSizes.join(','), currentMinPrice, currentMaxPrice, currentPage]);

  const hasActiveFilters = currentSizes.length > 0 || currentMinPrice || currentMaxPrice;

  return (
    <div className="min-h-screen">
      {/* Category header */}
      <div className="bg-surface py-8 md:py-10">
        <div className="container">
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground capitalize"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {category?.name || slug.replace(/-/g, ' ')}
          </h1>
          {category?.description && (
            <p className="text-sm text-muted mt-2 max-w-2xl">{category.description}</p>
          )}
          <p className="text-sm text-muted mt-3">{total} products available</p>
        </div>
      </div>

      <div className="container py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors"
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {currentSizes.length + (currentMinPrice ? 1 : 0) + (currentMaxPrice ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative ml-auto">
            <select
              value={currentSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="appearance-none bg-white border border-border rounded-lg px-4 py-2.5 pr-10 text-sm font-medium cursor-pointer hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {currentSizes.map(size => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors"
              >
                Size: {size}
                <X size={12} />
              </button>
            ))}
            {(currentMinPrice || currentMaxPrice) && (
              <button
                onClick={() => updateFilters({ minPrice: '', maxPrice: '' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors"
              >
                Price: ₹{currentMinPrice || '0'} - ₹{currentMaxPrice || '∞'}
                <X size={12} />
              </button>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-muted hover:text-primary transition-colors underline"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filter sidebar — desktop */}
          <aside className={cn(
            'w-64 shrink-0',
            'hidden lg:block',
          )}>
            <div className="sticky top-24 space-y-8">
              {/* Subcategories (Product Type) */}
              {category?.children && category.children.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Product Type</h3>
                  <div className="space-y-2">
                    {category.children.map((child: any) => (
                      <Link
                        key={child.id}
                        href={`/category/${child.slug}`}
                        className={cn(
                          "block text-sm py-1 transition-colors hover:text-primary",
                          slug === child.slug ? "text-primary font-bold" : "text-muted"
                        )}
                      >
                        {child.name}
                        {child._count?.products !== undefined && (
                          <span className="ml-1.5 text-[10px] opacity-60">({child._count.products})</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Size filter */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={cn(
                        'px-3.5 py-2 rounded-lg border text-xs font-medium transition-all',
                        currentSizes.includes(size)
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'border-border text-foreground hover:border-primary hover:text-primary bg-white'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Price Range</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={currentMinPrice}
                      onChange={(e) => updateFilters({ minPrice: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
                    />
                  </div>
                  <span className="text-muted">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={currentMaxPrice}
                      onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile filters (bottom sheet) */}
          {isFilterOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-surface rounded-full"><X size={20} /></button>
                </div>

                {/* Subcategories Mobile */}
                {category?.children && category.children.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold mb-4 uppercase tracking-wider">Product Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {category.children.map((child: any) => (
                        <Link
                          key={child.id}
                          href={`/category/${child.slug}`}
                          className={cn(
                            "px-4 py-2.5 rounded-full border text-sm font-medium transition-all",
                            slug === child.slug 
                              ? "bg-primary text-white border-primary" 
                              : "border-border bg-white"
                          )}
                          onClick={() => setIsFilterOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-wider">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={cn(
                          'px-5 py-3 rounded-xl border text-sm font-semibold transition-all',
                          currentSizes.includes(size)
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                            : 'border-border bg-white'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-wider">Price Range</h3>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">₹</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={currentMinPrice}
                        onChange={(e) => updateFilters({ minPrice: e.target.value })}
                        className="w-full pl-8 pr-4 py-3.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">₹</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={currentMaxPrice}
                        onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                        className="w-full pl-8 pr-4 py-3.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold text-base shadow-lg shadow-primary/20 transition-transform active:scale-95"
                >
                  Show {total} Results
                </button>
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] rounded-xl skeleton-shimmer" />
                    <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                    <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {products.map(product => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg font-semibold text-foreground mb-2">No products found</p>
                <p className="text-sm text-muted mb-6">Try adjusting your filters</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1).slice(0, 5).map(page => (
                  <button
                    key={page}
                    onClick={() => updateFilters({ page: String(page) })}
                    className={cn(
                      'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'bg-primary text-white'
                        : 'bg-surface text-foreground hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
