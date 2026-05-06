'use client';

import { useWishlistStore } from '@/stores/wishlistStore';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ProductCard from '@/components/product/ProductCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface WishlistProduct {
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
  variants: {
    id: string;
    size: string;
    color: string;
    price: number;
    mrp: number;
    stock: number;
  }[];
}

export default function WishlistPage() {
  const items = useWishlistStore(s => s.items);
  const removeMany = useWishlistStore(s => s.removeMany);
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // AbortController ref — cancels stale in-flight requests when `items` changes
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // --- No items → clear immediately, no network call
    if (items.length === 0) {
      // Cancel any pending request
      abortRef.current?.abort();
      setProducts([]);
      setError(null);
      return;
    }

    // --- Validate & deduplicate IDs before building the request
    const validIds = [
      ...new Set(
        items
          .filter((id) => typeof id === 'string' && id.trim().length > 0)
          .map((id) => id.trim())
      ),
    ];

    // All stored IDs were corrupted/empty — treat as empty
    if (validIds.length === 0) {
      setProducts([]);
      return;
    }

    // --- Cancel previous in-flight request (prevents race-condition stale updates)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchWishlist = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use URLSearchParams for safe query string encoding
        const qs = new URLSearchParams({
          ids: validIds.join(','),
          // Fetch up to 100 items (most wishlists won't exceed this)
          limit: String(Math.min(validIds.length, 100)),
        });

        const res = await fetch(`${API_BASE}/products?${qs.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
          
          // --- Pruning Stale Items ---
          // Identify which of the IDs we requested were actually returned
          const fetchedIds = new Set(json.data.map((p: any) => p.id));
          // We only sent up to 100 IDs in the query
          const requestedIds = validIds.slice(0, 100);
          const staleIds = requestedIds.filter(id => !fetchedIds.has(id));

          if (staleIds.length > 0) {
            removeMany(staleIds);
          }
        } else {
          throw new Error('Unexpected response format from server');
        }
      } catch (err: any) {
        // AbortError is expected when the component unmounts or items change —
        // silently swallow it rather than showing an error to the user.
        if (err.name === 'AbortError') return;

        console.error('[WishlistPage] Failed to load wishlist products:', err);
        setError('Could not load your wishlist right now. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();

    // Cleanup: abort the request if the component unmounts or effect re-runs
    return () => {
      controller.abort();
    };
  }, [items, mounted]);

  // Suppress hydration mismatch: don't render wishlist-specific UI until mounted
  if (!mounted) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">
        My Wishlist ({items.length})
      </h2>

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-muted text-sm">Loading your favorites...</p>
        </div>
      )}

      {/* ── Error banner (only shown when not loading) ── */}
      {!loading && error && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl">
          <Heart size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">Your wishlist is empty</p>
          <p className="text-sm text-muted mb-6">Save items you love for later.</p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Explore Products
          </Link>
        </div>
      )}

      {/* ── Product grid ── */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}

      {/* ── Loaded but backend returned 0 results (e.g. all products were deleted) ── */}
      {!loading && !error && items.length > 0 && products.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-xl">
          <Heart size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">
            Some items in your wishlist are no longer available.
          </p>
          <Link href="/" className="inline-block mt-4 text-sm text-primary font-semibold hover:underline">
            Browse more products
          </Link>
        </div>
      )}
    </div>
  );
}
