'use client';

import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore, CartItemData } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';

function CartItemRow({ item }: { item: CartItemData }) {
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const removeItem = useCartStore(s => s.removeItem);

  return (
    <div className="flex gap-3 py-4 border-b border-border last:border-b-0">
      {/* Product image */}
      <Link href={`/product/${item.productSlug}`} className="shrink-0">
        <div className="w-20 h-24 bg-surface rounded-lg overflow-hidden">
          <img
            src={item.productImage || 'https://placehold.co/160x192/f5f5f5/E8007A?text=Product'}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link href={`/product/${item.productSlug}`}>
          <h4 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
            {item.productName}
          </h4>
        </Link>
        <p className="text-xs text-muted mt-0.5">
          {item.comboId ? (
            <span className="text-primary font-bold">Bundle Deal</span>
          ) : (
            `${item.variantSize} · ${item.variantColor}`
          )}
        </p>

        {item.subItems && (
          <div className="mt-2 space-y-1">
            {item.subItems.map((sub, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-surface/50 px-2 py-0.5 rounded border border-border/50">
                <span className="font-bold text-primary shrink-0">Item {i + 1}:</span>
                <span className="truncate">{sub.productName} ({sub.variantSize})</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Quantity stepper */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="p-1.5 hover:bg-surface transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-sm font-medium flex items-center justify-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              className="p-1.5 hover:bg-surface transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Price + Remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              {formatPrice(item.price * item.quantity)}
            </span>
            <button
              onClick={() => removeItem(item.variantId)}
              className="p-1 text-muted hover:text-error transition-colors"
              aria-label="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const isOpen = useCartStore(s => s.isDrawerOpen);
  const closeDrawer = useCartStore(s => s.closeDrawer);
  const items = useCartStore(s => s.items);
  const subtotal = useCartStore(s => s.subtotal);
  const totalItems = useCartStore(s => s.totalItems);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
            <span className="text-sm text-muted">({totalItems()})</span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 -mr-2 hover:bg-surface rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Your cart is empty</h3>
              <p className="text-sm text-muted mb-6">Add some amazing premium products to get started!</p>
              <button
                onClick={closeDrawer}
                className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="py-2">
              {items.map(item => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer - show only when cart has items */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            {/* Subtotal */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="text-sm font-medium">{formatPrice(subtotal())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Delivery</span>
                <span className="text-sm font-medium text-success">
                  {subtotal() >= 999 ? 'FREE' : formatPrice(79)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-bold text-primary">
                  {formatPrice(subtotal() + (subtotal() >= 999 ? 0 : 79))}
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="block w-full py-3 bg-primary text-white text-center rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block w-full py-3 border border-border text-foreground text-center rounded-full font-medium text-sm hover:bg-surface transition-colors"
              >
                View Full Cart
              </Link>
            </div>

            {/* Free shipping nudge */}
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
        )}
      </div>
    </>
  );
}
