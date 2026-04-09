'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { productApi } from '@/lib/api';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  featured?: boolean;
  category?: string;
  limit?: number;
}

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
  variants: {
    id: string;
    size: string;
    color: string;
    price: number;
    mrp: number;
    stock: number;
  }[];
}

export default function ProductSection({ title, subtitle, featured, category, limit = 8 }: ProductSectionProps) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string | number | boolean> = { limit };
    if (featured) params.isFeatured = true;
    if (category) params.category = category;

    productApi.list(params)
      .then((res: unknown) => {
        const response = res as { data: ProductData[] };
        setProducts(response.data || []);
      })
      .catch(() => {
        // Suppress raw Error object logging so Next.js doesn't pop up the dev overlay
        console.warn('Backend is offline: Could not load products for ProductSection');
      })
      .finally(() => setLoading(false));
  }, [featured, category, limit]);

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-8 md:mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted mt-2">{subtitle}</p>
          )}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] rounded-xl skeleton-shimmer" />
                <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                <div className="h-4 w-1/2 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <>
            <p className="text-center text-muted py-6 text-sm">
              Products coming soon... <span className="text-xs">(Connect backend to load products)</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 opacity-30 pointer-events-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] rounded-xl skeleton-shimmer" />
                  <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                  <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
