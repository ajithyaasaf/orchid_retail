'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { comboApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingBag, ArrowLeft, CheckCircle2, ShieldCheck, Zap, Info } from 'lucide-react';
import Link from 'next/link';

interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  mrp: number;
  stock: number;
}

interface ComboProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    images: string[];
    variants: Variant[];
  };
}

interface ComboData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  mrp: number;
  products: ComboProduct[];
}

export default function ComboDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [combo, setCombo] = useState<ComboData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection state: { [comboProductId]: variantId }
  const [selections, setSelections] = useState<Record<string, string>>({});
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    const fetchCombo = async () => {
      try {
        const res = await comboApi.getBySlug(slug as string) as any;
        setCombo(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch bundle details');
      }
      setLoading(false);
    };
    fetchCombo();
  }, [slug]);

  const allSelected = useMemo(() => {
    if (!combo) return false;
    return combo.products.length === Object.keys(selections).length;
  }, [combo, selections]);

  const handleAddToCart = () => {
    if (!combo || !allSelected) return;

    const subItems = combo.products.map(cp => {
      const variant = cp.product.variants.find(v => v.id === selections[cp.id])!;
      return {
        productId: cp.product.id,
        variantId: variant.id,
        productName: cp.product.name,
        productImage: cp.product.images?.[0],
        variantSize: variant.size,
        variantColor: variant.color,
        sku: variant.sku,
      };
    });

    addItem({
      productId: combo.id, // Using combo ID as parent ID
      variantId: `combo-${combo.id}-${Date.now()}`, // Unique cart ID for this specific bundle selection
      quantity: 1,
      productName: combo.name,
      productImage: combo.images?.[0] || subItems[0].productImage,
      productSlug: combo.slug,
      variantSize: 'Bundle',
      variantColor: 'Multiple',
      price: combo.price,
      mrp: combo.mrp,
      comboId: combo.id,
      subItems: subItems,
    });

    router.push('/cart');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse">Loading Bundle Customizer...</p>
      </div>
    </div>
  );

  if (error || !combo) return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Oops! Deal Not Found</h2>
        <p className="text-muted mb-8">{error || "This bundle may have expired or is no longer available."}</p>
        <Link href="/combos" className="px-8 py-3 bg-primary text-white rounded-xl font-bold">Browse Other Deals</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="container py-8 md:py-12">
        {/* Breadcrumbs & Back */}
        <Link href="/combos" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Combo Deals
        </Link>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Combo Info & Image */}
          <div className="lg:col-span-5 space-y-8">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <img src={combo.images?.[0]} alt={combo.name} className="w-full h-full object-cover" />
              <div className="absolute top-6 left-6 px-4 py-2 bg-primary text-white text-sm font-black rounded-full shadow-xl">
                SAVE {Math.round((1 - combo.price / combo.mrp) * 100)}%
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-black tracking-tight">{combo.name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-primary">{formatPrice(combo.price)}</span>
                <span className="text-lg text-muted line-through font-medium">{formatPrice(combo.mrp)}</span>
              </div>
              <p className="text-muted leading-relaxed">{combo.description}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-border space-y-4 shadow-sm">
              <div className="flex items-center gap-3 text-success font-bold text-sm">
                <ShieldCheck size={20} /> Factory-Direct Quality Guaranteed
              </div>
              <div className="flex items-center gap-3 text-primary font-bold text-sm">
                <Zap size={20} /> Limited Time Bundle Offer
              </div>
            </div>
          </div>

          {/* Right Column: Customizer */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-xl border border-border overflow-hidden">
              <div className="p-8 border-b border-border bg-surface/50">
                <h2 className="text-xl font-bold mb-1">Customize Your Bundle</h2>
                <p className="text-sm text-muted">Select size and color for each item in the pack</p>
              </div>

              <div className="p-8 space-y-10">
                {combo.products.map((cp, idx) => (
                  <div key={cp.id} className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{cp.product.name}</h3>
                        <p className="text-xs text-muted mb-6">Choose your variation below</p>
                        
                        <div className="space-y-6">
                          {/* Variant Selectors */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {cp.product.variants.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => setSelections(prev => ({ ...prev, [cp.id]: v.id }))}
                                className={cn(
                                  "relative p-3 rounded-xl border-2 text-left transition-all",
                                  selections[cp.id] === v.id
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/30"
                                )}
                              >
                                <div className="text-[10px] font-bold text-muted uppercase mb-1">{v.color}</div>
                                <div className="text-sm font-black">{v.size}</div>
                                {selections[cp.id] === v.id && (
                                  <div className="absolute top-2 right-2 text-primary">
                                    <CheckCircle2 size={14} />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-surface shrink-0">
                        <img src={cp.product.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sticky Footer for Mobile, Inline for Desktop */}
              <div className="p-8 bg-surface border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Bundle Total</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">{formatPrice(combo.price)}</span>
                    <span className="text-sm font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                      YOU SAVE {formatPrice(combo.mrp - combo.price)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={!allSelected}
                  className={cn(
                    "w-full md:w-auto px-12 py-4 rounded-2xl font-black text-lg transition-all shadow-xl",
                    allSelected 
                      ? "bg-primary text-white shadow-primary/30 hover:bg-primary-dark active:scale-[0.98]" 
                      : "bg-border text-muted cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingBag size={22} />
                    {allSelected ? "Add Bundle to Cart" : "Select All Sizes"}
                  </div>
                </button>
              </div>
            </div>

            {/* Help/Info */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-border">
                <Info size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold mb-1">Easy Exchanges</p>
                  <p className="text-[10px] text-muted">Exchange any item in your bundle if size doesn't fit.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-border">
                <ShieldCheck size={18} className="text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold mb-1">Secure Shipping</p>
                  <p className="text-[10px] text-muted">Tracking provided for all factory-direct bundles.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
