'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const items = useCartStore(s => s.items);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const removeItem = useCartStore(s => s.removeItem);
  const subtotal = useCartStore(s => s.subtotal);
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const deliveryCharge = subtotal() >= 999 ? 0 : 79;
  const discount = couponApplied ? Math.min(subtotal() * 0.1, 200) : 0;
  const total = subtotal() - discount + deliveryCharge;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-muted" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
        <p className="text-muted mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-surface rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-playfair)' }}>
          Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.variantId} className="flex gap-4 p-4 bg-white border border-border rounded-xl">
              <Link href={`/product/${item.productSlug}`} className="shrink-0">
                <div className="w-24 h-30 md:w-28 md:h-36 bg-surface rounded-lg overflow-hidden">
                  <img src={item.productImage || 'https://placehold.co/200x260/f5f5f5/E8007A?text=Product'} alt={item.productName} className="w-full h-full object-cover" />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.productSlug}`}>
                  <h3 className="text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors line-clamp-2">{item.productName}</h3>
                </Link>
                <p className="text-xs text-muted mt-1">{item.variantSize} · {item.variantColor}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold">{formatPrice(item.price)}</span>
                  {item.mrp > item.price && <span className="text-xs text-muted line-through">{formatPrice(item.mrp)}</span>}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="p-2 hover:bg-surface transition-colors"><Minus size={14} /></button>
                    <span className="w-10 text-center text-sm font-semibold flex items-center justify-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="p-2 hover:bg-surface transition-colors"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} className="flex items-center gap-1.5 text-xs text-muted hover:text-error transition-colors">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>

            {/* Coupon */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => setCouponApplied(!!couponCode)}
                className="px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors"
              >
                Apply
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-success">Coupon Discount</span>
                  <span className="text-success font-medium">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-success font-medium' : 'font-medium'}>
                  {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-border">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-3.5 bg-primary text-white text-center rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors"
            >
              Proceed to Checkout
            </Link>

            <div className="h-[18px]">
              {subtotal() < 999 ? (
                <p className="text-xs text-center text-muted">
                  Add {formatPrice(999 - subtotal())} more for <span className="text-primary font-medium">FREE delivery</span>
                </p>
              ) : (
                <p className="text-xs text-center text-success font-medium">
                  You have unlocked FREE delivery!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
