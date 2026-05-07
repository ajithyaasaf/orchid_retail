'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoryApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

const ICON_MAP: Record<string, string> = {
  'new-born': '👶',
  'girls': '👧',
  'boys': '👦',
  'women': '👩',
  'mens': '👨',
};

export default function CategoryStrip() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.list()
      .then((res: any) => {
        if (res.success) {
          // Filter to only show top-level categories for the strip
          setCategories(res.data.filter((c: any) => !c.parentId) || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 md:py-16 bg-white border-b border-border/40">
      <div className="container">
        <h2
          className="text-2xl md:text-4xl font-bold text-center text-foreground mb-12"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Shop by Category
        </h2>

        <div className="flex gap-6 md:gap-12 overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-4 shrink-0 animate-pulse">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-surface" />
                <div className="w-20 h-4 bg-surface rounded" />
              </div>
            ))
          ) : (
            categories.map(cat => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-4 group shrink-0"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-primary/5 flex items-center justify-center text-4xl md:text-5xl group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/20 border border-primary/5">
                  {ICON_MAP[cat.slug] || '📦'}
                </div>
                <div className="text-center">
                  <span className="block text-sm md:text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight uppercase">
                    {cat.name}
                  </span>
                  {cat._count && (
                    <span className="text-[10px] text-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {cat._count.products} Products
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
