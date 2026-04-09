'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { productApi } from '@/lib/api';
import { Search, TrendingUp, Clock } from 'lucide-react';

interface ProductData {
  id: string; name: string; slug: string; images: string[]; minPrice: number; minMrp: number;
  totalStock: number; averageRating: number; reviewCount: number; exportBadge: boolean;
  variants: { id: string; size: string; color: string; price: number; mrp: number; stock: number }[];
}

const TRENDING = ['Export Quality', 'Dresses', 'Cotton Shirts', 'Palazzo', 'Kids Wear', 'Sneakers'];

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    setLoading(true);
    productApi.list({ search: query, limit: 40 })
      .then((res: unknown) => {
        const r = res as { data: ProductData[]; pagination: { total: number } };
        setResults(r.data || []);
        setTotal(r.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  return (
    <div className="container py-6 md:py-10 min-h-screen">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search for products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-surface rounded-2xl text-base border border-transparent focus:border-primary focus:bg-white focus:outline-none transition-all"
            autoFocus
          />
        </div>
      </form>

      {query ? (
        <>
          <p className="text-sm text-muted mb-6">
            {loading ? 'Searching...' : `${total} results for "${query}"`}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] rounded-xl skeleton-shimmer" />
                  <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                  <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {results.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-muted" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <p className="text-sm text-muted mb-6">Try searching with different keywords</p>
              <div className="flex flex-wrap justify-center gap-2">
                {TRENDING.map(term => (
                  <a key={term} href={`/search?q=${encodeURIComponent(term)}`}
                    className="px-4 py-2 bg-surface rounded-full text-xs font-medium text-foreground hover:bg-primary hover:text-white transition-colors">
                    {term}
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="text-base font-semibold">Trending Searches</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map(term => (
                <a key={term} href={`/search?q=${encodeURIComponent(term)}`}
                  className="px-4 py-2.5 bg-surface rounded-full text-sm font-medium text-foreground hover:bg-primary hover:text-white transition-colors">
                  {term}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
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
