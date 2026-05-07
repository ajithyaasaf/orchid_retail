'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Loader2, Package, Tag, ArrowRight } from 'lucide-react';
import { productApi, categoryApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useCategoryStore } from '@/stores/categoryStore';

interface SearchResult {
  products: any[];
  categories: any[];
}

export default function SearchAutocomplete({ 
  query, 
  onClose 
}: { 
  query: string; 
  onClose: () => void;
}) {
  const [results, setResults] = useState<SearchResult>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const { categories: allCategories } = useCategoryStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ products: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // 1. Search Categories (Local filter from store is faster)
        const matchedCats = allCategories.filter(c => 
          c.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 3);

        // 2. Search Products (API call)
        const res: any = await productApi.list({ search: query, limit: 5 });
        
        setResults({
          categories: matchedCats,
          products: res.data || [],
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, allCategories]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!query || query.length < 2) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center gap-3 text-muted">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-xs font-medium">Searching for "{query}"...</p>
        </div>
      ) : results.products.length === 0 && results.categories.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={20} className="text-muted" />
          </div>
          <p className="text-sm font-bold text-foreground">No matches found</p>
          <p className="text-xs text-muted">Try searching for "frocks" or "t-shirts"</p>
        </div>
      ) : (
        <div className="max-h-[480px] overflow-y-auto scrollbar-hide">
          {/* Categories Section */}
          {results.categories.length > 0 && (
            <div className="p-4 border-b border-border/50 bg-surface/30">
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                <Tag size={12} /> Suggested Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={onClose}
                    className="px-3 py-1.5 bg-white border border-border/50 rounded-full text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {results.products.length > 0 && (
            <div className="p-2">
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 flex items-center gap-2">
                <Package size={12} /> Products
              </h3>
              <div className="space-y-1">
                {results.products.map(product => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 group transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface shrink-0 border border-border/30">
                      <img 
                        src={product.images[0] || 'https://placehold.co/100x100?text=Product'} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted">
                        {product.category?.name || 'Category'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        {formatPrice(product.variants?.[0]?.price || 0)}
                      </p>
                      {product.variants?.[0]?.mrp > product.variants?.[0]?.price && (
                        <p className="text-[10px] text-muted line-through">
                          {formatPrice(product.variants[0].mrp)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* View All Button */}
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 p-4 text-sm font-bold text-primary hover:bg-primary/5 transition-colors border-t border-border/50"
          >
            View all results
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
