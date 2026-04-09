'use client';

import { useWishlistStore } from '@/stores/wishlistStore';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function WishlistPage() {
  const items = useWishlistStore(s => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">My Wishlist ({items.length})</h2>
      {items.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-xl">
          <Heart size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">Your wishlist is empty</p>
          <p className="text-sm text-muted mb-6">Save items you love for later.</p>
          <Link href="/" className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-xl p-6">
          <p className="text-sm text-muted">
            You have {items.length} items in your wishlist. Visit individual product pages to view them.
          </p>
        </div>
      )}
    </div>
  );
}
