'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { productApi } from '@/lib/api';
import { Search, TrendingUp, Clock, ChevronRight, Filter, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { cn } from '@/lib/utils';

interface ProductData {
  id: string; name: string; slug: string; images: string[]; minPrice: number; minMrp: number;
  totalStock: number; averageRating: number; reviewCount: number; exportBadge: boolean;
  variants: { id: string; size: string; color: string; price: number; mrp: number; stock: number }[];
}

const TRENDING = ['Export Quality', 'Dresses', 'Cotton Shirts', 'Palazzo', 'Kids Wear', 'Sneakers'];

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  
  const [results, setResults] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(query);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter state
  const [currentSort, setCurrentSort] = useState('newest');
  const [currentSizes, setCurrentSizes] = useState<string[]>([]);
  const [currentMinPrice, setCurrentMinPrice] = useState('');
  const [currentMaxPrice, setCurrentMaxPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const { categories, fetchCategories } = useCategoryStore();

  const fetchResults = () => {
    if (!query) { setResults([]); return; }
    setLoading(true);
    productApi.list({ 
      search: query, 
      category: selectedCategory || undefined,
      sizes: currentSizes.length > 0 ? currentSizes.join(',') : undefined,
      minPrice: currentMinPrice || undefined,
      maxPrice: currentMaxPrice || undefined,
      sort: currentSort,
      limit: 40 
    })
      .then((res: any) => {
        setResults(res.data || []);
        setTotal(res.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [query, selectedCategory, currentSizes, currentMinPrice, currentMaxPrice, currentSort]);

  const toggleSize = (size: string) => {
    setCurrentSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const FiltersContent = () => (
    <div className="space-y-8">
      {/* Categories Facet */}
      <div className="bg-surface/50 p-6 rounded-2xl border border-border/50">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">Categories</h3>
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedCategory('')}
            className={cn(
              "block text-sm transition-colors",
              !selectedCategory ? "text-primary font-bold" : "text-muted hover:text-primary"
            )}
          >
            All Categories
          </button>
          {categories.filter(c => !c.parentId).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                "block text-sm transition-colors text-left w-full",
                selectedCategory === cat.slug ? "text-primary font-bold" : "text-muted hover:text-primary"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div className="px-2">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">Size</h3>
        <div className="flex flex-wrap gap-2">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={cn(
                "w-10 h-10 rounded-lg border text-xs font-bold transition-all",
                currentSizes.includes(size) 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                  : "border-border bg-white text-muted hover:border-primary hover:text-primary"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="px-2">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">Price Range</h3>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Min" 
            value={currentMinPrice}
            onChange={(e) => setCurrentMinPrice(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:border-primary outline-none"
          />
          <span className="text-muted">—</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={currentMaxPrice}
            onChange={(e) => setCurrentMaxPrice(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:border-primary outline-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-8 md:py-12 min-h-screen">
      {/* Header section */}
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
          {query ? `Results for "${query}"` : 'Search our store'}
        </h1>
        
        <div className="relative max-w-2xl mx-auto group">
          <form onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/search?q=${encodeURIComponent(searchInput)}${selectedCategory ? `&category=${selectedCategory}` : ''}`;
          }} className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search for anything..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-border rounded-full shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-base"
            />
          </form>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Trigger */}
        <div className="lg:hidden flex items-center gap-3 mb-2">
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-border rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
          >
            <SlidersHorizontal size={18} />
            Filters & Sort
            {(currentSizes.length > 0 || currentMinPrice || currentMaxPrice) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Mobile Filter Drawer */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-surface rounded-full"><X size={20} /></button>
              </div>
              <FiltersContent />
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold mt-8 shadow-lg shadow-primary/20"
              >
                Show Results
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Filters — Desktop Only */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <FiltersContent />
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted font-medium">
              {loading ? 'Searching...' : `${total} items found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-bold uppercase tracking-wider">Sort:</span>
              <select 
                value={currentSort}
                onChange={(e) => setCurrentSort(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="aspect-[3/4] bg-surface rounded-2xl" />
                  <div className="h-4 bg-surface w-2/3 rounded" />
                  <div className="h-4 bg-surface w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {results.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface/30 rounded-3xl border border-dashed border-border">
              <Search size={40} className="mx-auto text-muted mb-4 opacity-20" />
              <h2 className="text-xl font-bold mb-2">No items match your search</h2>
              <p className="text-sm text-muted">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container py-20 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted">Loading search...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
