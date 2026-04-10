'use client';

import Link from 'next/link';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { formatPrice, calculateDiscount, cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  images: string[];
  minPrice: number;
  minMrp: number;
  totalStock: number;
  averageRating?: number;
  reviewCount?: number;
  exportBadge?: boolean;
  variants?: {
    id: string;
    size: string;
    color: string;
    price: number;
    mrp: number;
    stock: number;
  }[];
}

export default function ProductCard({
  id,
  name,
  slug,
  images,
  minPrice,
  minMrp,
  totalStock,
  averageRating = 0,
  reviewCount = 0,
  exportBadge,
  variants,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toggle, isWishlisted } = useWishlistStore();
  const addItem = useCartStore(s => s.addItem);
  const wishlisted = isWishlisted(id);
  const discount = calculateDiscount(minMrp, minPrice);
  const outOfStock = totalStock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || !variants?.length) return;
    // Add first available variant
    const available = variants.find(v => v.stock > 0);
    if (!available) return;
    addItem({
      productId: id,
      variantId: available.id,
      quantity: 1,
      productName: name,
      productImage: images[0] || '',
      productSlug: slug,
      variantSize: available.size,
      variantColor: available.color,
      price: available.price,
      mrp: available.mrp,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
  };

  return (
    <Link
      href={`/product/${slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-surface rounded-xl overflow-hidden mb-3">
        <img
          src={images[0] || process.env.NEXT_PUBLIC_DEFAULT_IMAGE_URL || 'https://placehold.co/450x600/f5f5f5/E8007A?text=Orchid'}
          alt={name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-500',
            isHovered && 'scale-110'
          )}
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-md">
              -{discount}%
            </span>
          )}
          {exportBadge && (
            <span className="px-2 py-0.5 bg-hero-bg text-white text-[10px] font-semibold rounded-md uppercase tracking-wider">
              Export Quality
            </span>
          )}
          {outOfStock && (
            <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-medium rounded-md">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm',
            wishlisted
              ? 'bg-primary text-white'
              : 'bg-white/90 text-foreground hover:bg-white hover:text-primary'
          )}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick add button (on hover) */}
        {!outOfStock && (
          <button
            onClick={handleQuickAdd}
            className={cn(
              'absolute bottom-0 left-0 right-0 py-2.5 bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300',
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            )}
          >
            <ShoppingBag size={16} />
            Quick Add
          </button>
        )}
      </div>

      {/* Info */}
      <div className="px-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {name}
        </h3>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-success/10 rounded text-success">
              <Star size={11} fill="currentColor" />
              <span className="text-xs font-semibold">{averageRating?.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-base font-bold text-foreground">{formatPrice(minPrice)}</span>
          {discount > 0 && (
            <>
              <span className="text-sm text-muted line-through">{formatPrice(minMrp)}</span>
              <span className="text-xs font-semibold text-primary">({discount}% OFF)</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
