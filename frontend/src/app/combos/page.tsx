'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { comboApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ChevronRight, Sparkles, Tag, Package } from 'lucide-react';

interface ComboData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  mrp: number;
  products: {
    product: {
      name: string;
      images: string[];
    };
  }[];
}

export default function ComboDealsPage() {
  const [combos, setCombos] = useState<ComboData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await comboApi.list() as any;
        setCombos(res.data || []);
      } catch (e) {
        console.error('Failed to fetch combos:', e);
      }
      setLoading(false);
    };
    fetchCombos();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Header */}
      <div className="bg-hero-bg text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary opacity-10 mix-blend-overlay" />
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-primary mb-6 animate-fade-in">
            <Sparkles size={14} /> Factory-Direct Bundles
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Combo Deals</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Maximize your value with our curated packs. Premium quality items bundled at wholesale prices. 
            Select your sizes and customize your perfect set.
          </p>
        </div>
      </div>

      <div className="container py-12 -mt-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[450px] bg-white rounded-3xl skeleton-shimmer shadow-xl shadow-black/5" />
            ))}
          </div>
        ) : combos.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center shadow-xl shadow-black/5">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-muted" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Active Combos</h2>
            <p className="text-muted mb-8 max-w-md mx-auto">
              We're currently updating our bundle deals. Check back soon for exclusive factory-direct packs!
            </p>
            <Link href="/" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {combos.map((combo) => (
              <div key={combo.id} className="group bg-white rounded-3xl shadow-xl shadow-black/5 border border-border overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* Image Section */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img 
                    src={combo.images?.[0] || 'https://placehold.co/600x750?text=Bundle'} 
                    alt={combo.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                      <Tag size={12} /> SAVE {Math.round((1 - combo.price / combo.mrp) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">{combo.name}</h3>
                  <p className="text-sm text-muted mb-6 line-clamp-2 h-10">{combo.description}</p>
                  
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Packs Includes:</p>
                    <div className="flex items-center gap-2 overflow-hidden">
                      {combo.products.map((p, idx) => (
                        <div key={idx} className="w-10 h-12 rounded-lg bg-surface border border-border overflow-hidden shrink-0 shadow-sm" title={p.product.name}>
                          <img src={p.product.images?.[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="text-[10px] font-bold text-muted ml-1">
                        {combo.products.length} Items Total
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-foreground">{formatPrice(combo.price)}</p>
                      <p className="text-xs text-muted line-through font-medium">{formatPrice(combo.mrp)} MRP</p>
                    </div>
                    <Link 
                      href={`/combo/${combo.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-95 transition-all"
                    >
                      Shop the Deal <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
