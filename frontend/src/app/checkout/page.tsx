'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { orderApi, paymentApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { MapPin, Truck, CreditCard, Check, ArrowLeft, ShoppingBag } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Address', icon: MapPin },
  { id: 2, label: 'Delivery', icon: Truck },
  { id: 3, label: 'Payment', icon: CreditCard },
];

export default function CheckoutPage() {
  const items = useCartStore(s => s.items);
  const subtotal = useCartStore(s => s.subtotal);
  const clearCart = useCartStore(s => s.clearCart);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Address form
  const [address, setAddress] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India',
  });

  // Delivery option
  const [deliveryOption, setDeliveryOption] = useState('standard');

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const deliveryCharge = deliveryOption === 'express' ? 149 : (subtotal() >= 999 ? 0 : 79);
  const total = subtotal() + deliveryCharge;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag size={48} className="text-muted mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted mb-6">Add some items to proceed to checkout.</p>
        <Link href="/" className="inline-flex px-6 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      // In production, address would be saved first and we'd use addressId
      // For now, create order with a mock address ID
      const orderResponse = await orderApi.create({
        items: items.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
        shippingAddressId: 'temp-address-id', // Would be real after address save
      }) as { data: { id: string } };

      // Initiate payment
      const paymentResponse = await paymentApi.initiate(orderResponse.data.id) as {
        data: { redirectUrl: string; merchantTransactionId: string };
      };

      // In production, redirect to PhonePe
      // For dev, go to order success
      clearCart();
      window.location.href = `/order-success?orderId=${orderResponse.data.id}`;
    } catch (error) {
      console.error('Order failed:', error);
      alert(error instanceof Error ? error.message : 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 md:py-10 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="p-2 hover:bg-surface rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10 max-w-md mx-auto">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
              currentStep >= step.id ? 'bg-primary text-white' : 'bg-surface text-muted'
            )}>
              {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
            </div>
            <span className={cn('ml-2 text-xs font-medium hidden sm:inline', currentStep >= step.id ? 'text-primary' : 'text-muted')}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('w-12 md:w-20 h-0.5 mx-2', currentStep > step.id ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {currentStep === 1 && (
            <div className="bg-white border border-border rounded-xl p-6 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6">Delivery Address</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Full Name *</label>
                  <input type="text" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Phone *</label>
                  <input type="tel" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="+91 98765 43210" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted mb-1.5 block">Address Line 1 *</label>
                  <input type="text" value={address.addressLine1} onChange={e => setAddress({ ...address, addressLine1: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="House/Flat No., Street" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted mb-1.5 block">Address Line 2</label>
                  <input type="text" value={address.addressLine2} onChange={e => setAddress({ ...address, addressLine2: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="Landmark, Area" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">City *</label>
                  <input type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="City" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">State *</label>
                  <input type="text" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="State" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Pincode *</label>
                  <input type="text" maxLength={6} value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="600001" />
                </div>
              </div>
              <button onClick={() => setCurrentStep(2)}
                className="mt-6 w-full py-3.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors">
                Continue to Delivery
              </button>
            </div>
          )}

          {/* Step 2: Delivery */}
          {currentStep === 2 && (
            <div className="bg-white border border-border rounded-xl p-6 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6">Delivery Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'standard', name: 'Standard Delivery', time: '3-5 business days', price: subtotal() >= 999 ? 'FREE' : '₹79' },
                  { id: 'express', name: 'Express Delivery', time: '1-2 business days', price: '₹149' },
                ].map(opt => (
                  <label key={opt.id}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors',
                      deliveryOption === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        deliveryOption === opt.id ? 'border-primary' : 'border-border')}>
                        {deliveryOption === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{opt.name}</span>
                        <span className="block text-xs text-muted">{opt.time}</span>
                      </div>
                    </div>
                    <span className={cn('text-sm font-semibold', opt.price === 'FREE' ? 'text-success' : '')}>{opt.price}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setCurrentStep(1)} className="flex-1 py-3.5 border border-border rounded-full font-medium text-sm hover:bg-surface transition-colors">Back</button>
                <button onClick={() => setCurrentStep(3)} className="flex-1 py-3.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors">Continue to Payment</button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="bg-white border border-border rounded-xl p-6 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6">Payment</h2>
              <div className="bg-surface rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CreditCard size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Pay with PhonePe</h3>
                  <p className="text-sm text-muted mt-1">UPI, Credit/Debit Cards, Net Banking</p>
                </div>
                <p className="text-2xl font-bold text-primary">{formatPrice(total)}</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setCurrentStep(2)} className="flex-1 py-3.5 border border-border rounded-full font-medium text-sm hover:bg-surface transition-colors">Back</button>
                <button onClick={handlePlaceOrder} disabled={loading}
                  className={cn('flex-1 py-3.5 bg-primary text-white rounded-full font-semibold text-sm transition-colors',
                    loading ? 'opacity-60 cursor-wait' : 'hover:bg-primary-dark')}>
                  {loading ? 'Processing...' : 'Place Order & Pay'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map(item => (
                <div key={item.variantId} className="flex gap-3">
                  <div className="w-12 h-14 bg-surface rounded-lg overflow-hidden shrink-0">
                    <img src={item.productImage || 'https://placehold.co/96x112/f5f5f5/E8007A?text=P'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{item.productName}</p>
                    <p className="text-[10px] text-muted">{item.variantSize} · {item.variantColor} × {item.quantity}</p>
                    <p className="text-xs font-semibold mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>{formatPrice(subtotal())}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted">Delivery</span><span className={deliveryCharge === 0 ? 'text-success' : ''}>{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</span></div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                <span>Total</span><span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
