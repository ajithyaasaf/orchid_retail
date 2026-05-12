'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { orderApi, paymentApi, addressApi, couponApi, type AddressData } from '@/lib/api';
import { useGuestId } from '@/lib/useGuestId';
import { formatPrice, cn } from '@/lib/utils';
import { calculateShippingCharge } from '@orchid/shared';
import Link from 'next/link';
import { MapPin, Truck, CreditCard, Check, ArrowLeft, ShoppingBag, Loader2, AlertCircle, Tag, Trash2, Plus } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Address', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Dynamically load Razorpay checkout script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const guestId = useGuestId();
  const items = useCartStore(s => s.items);
  const subtotal = useCartStore(s => s.subtotal);
  const hasFreeShippingItem = useCartStore(s => s.hasFreeShippingItem);
  const clearCart = useCartStore(s => s.clearCart);
  
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Address State
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: 'Tamil Nadu', pincode: '', country: 'India',
  });

  // Order Details
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Fetch saved addresses for this guest
  useEffect(() => {
    if (mounted && guestId) {
      addressApi.list(guestId)
        .then(res => {
          setSavedAddresses(res.data);
          const def = res.data.find(a => a.isDefault);
          if (def) setSelectedAddressId(def.id);
          else if (res.data.length > 0) setSelectedAddressId(res.data[0].id);
          else setShowAddressForm(true);
        })
        .catch(err => console.error('Error loading addresses:', err));
    }
  }, [mounted, guestId]);

  if (!mounted || !guestId) return null;

  const deliveryCharge = calculateShippingCharge(subtotal(), deliveryOption, hasFreeShippingItem());
  const discount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal() - discount + deliveryCharge);

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

  // Address Validation
  const cleanPhone = addressForm.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
  const isFormValid = 
    addressForm.name.length >= 3 &&
    /^\d{10}$/.test(cleanPhone) &&
    addressForm.addressLine1.length >= 5 &&
    addressForm.city.length >= 2 &&
    addressForm.state.length > 0 &&
    /^[1-9]\d{5}$/.test(addressForm.pincode);

  const handleSaveAddress = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await addressApi.create({ ...addressForm, userId: guestId });
      setSavedAddresses([res.data, ...savedAddresses]);
      setSelectedAddressId(res.data.id);
      setShowAddressForm(false);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await couponApi.validate(couponCode, guestId, subtotal());
      setAppliedCoupon({ code: res.data.code, discount: res.data.discount });
    } catch (err: any) {
      setError(err.message || 'Invalid coupon');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      setCurrentStep(1);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load payment gateway');

      // 2. Create Order in DB
      const orderResponse = await orderApi.create({
        userId: guestId,
        items: items.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
        shippingAddressId: selectedAddressId,
        deliveryOption,
        couponCode: appliedCoupon?.code
      }) as any;

      const dbOrder = orderResponse.data;

      // 3. Get Razorpay Order ID
      const paymentResponse = await paymentApi.createOrder(dbOrder.id);
      const { razorpayOrderId, amount, currency, keyId } = paymentResponse.data;

      // 4. Open Razorpay Popup
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Orchid',
        description: `Order #${dbOrder.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: savedAddresses.find(a => a.id === selectedAddressId)?.name,
          contact: savedAddresses.find(a => a.id === selectedAddressId)?.phone,
        },
        theme: { color: '#E8007A' },
        handler: async (response: any) => {
          try {
            setLoading(true);
            await paymentApi.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: dbOrder.id,
            });
          } catch (err) {
            console.error('Verification error:', err);
            // Even if verification fails (e.g. network blip), we trust the frontend success 
            // for UX and let the webhook handle the DB reconciliation.
          } finally {
            clearCart();
            window.location.href = `/order-success?orderId=${dbOrder.id}`;
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (res: any) => {
        setError(res.error?.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Order placement failed');
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 md:py-10 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="p-2 hover:bg-surface rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="flex items-center justify-center gap-2 mb-10 max-w-md mx-auto">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
              currentStep >= step.id ? 'bg-primary text-white' : 'bg-surface text-muted'
            )}>
              {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
            </div>
            <span className={cn('ml-2 text-xs font-medium hidden sm:inline', currentStep >= step.id ? 'text-primary' : 'text-muted')}>{step.label}</span>
            {i < STEPS.length - 1 && <div className={cn('w-12 md:w-20 h-0.5 mx-2', currentStep > step.id ? 'bg-primary' : 'bg-border')} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {error && <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex gap-3"><AlertCircle size={18} /> {error}</div>}

          {/* STEP 1: ADDRESS */}
          {currentStep === 1 && (
            <div className="bg-white border border-border rounded-xl p-6 animate-fade-in space-y-6">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              
              {!showAddressForm && savedAddresses.length > 0 && (
                <div className="space-y-3">
                  {savedAddresses.map(a => (
                    <label key={a.id} className={cn('flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors', selectedAddressId === a.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                      <input type="radio" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} className="mt-1" />
                      <div className="text-sm">
                        <p className="font-semibold">{a.name} <span className="text-muted font-normal">({a.phone})</span></p>
                        <p className="text-muted">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                        <p className="text-muted">{a.city}, {a.state} - {a.pincode}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => {
                    setAddressForm({
                      name: '', phone: '', addressLine1: '', addressLine2: '',
                      city: '', state: 'Tamil Nadu', pincode: '', country: 'India',
                    });
                    setShowAddressForm(true);
                  }} className="flex items-center gap-2 text-sm text-primary font-medium p-2 hover:bg-primary/5 rounded-lg transition-colors">
                    <Plus size={16} /> Add New Address
                  </button>
                  <button onClick={() => setCurrentStep(2)} className="w-full py-3.5 bg-primary text-white rounded-full font-semibold mt-4">Continue to Payment</button>
                </div>
              )}

              {(showAddressForm || savedAddresses.length === 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-xs font-medium text-muted mb-1.5 block">Full Name *</label>
                    <input type="text" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="John Doe" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-medium text-muted mb-1.5 block">Phone (10-digit) *</label>
                    <input type="tel" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="9876543210" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted mb-1.5 block">Address Line 1 *</label>
                    <input type="text" value={addressForm.addressLine1} onChange={e => setAddressForm({...addressForm, addressLine1: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="House/Flat No, Street" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted mb-1.5 block">Address Line 2 (Optional)</label>
                    <input type="text" value={addressForm.addressLine2} onChange={e => setAddressForm({...addressForm, addressLine2: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="Landmark, Area" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted mb-1.5 block">City *</label>
                    <input type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted mb-1.5 block">State *</label>
                    <select value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-white">
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted mb-1.5 block">Pincode *</label>
                    <input type="text" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0,6)})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="600001" />
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    {savedAddresses.length > 0 && <button onClick={() => setShowAddressForm(false)} className="flex-1 py-3.5 border border-border rounded-full font-medium">Cancel</button>}
                    <button onClick={handleSaveAddress} disabled={!isFormValid || loading} className={cn('flex-1 py-3.5 rounded-full font-semibold transition-colors', isFormValid ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400')}>
                      {loading ? 'Saving...' : 'Save & Continue'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* STEP 2: PAYMENT */}
          {currentStep === 2 && (
            <div className="bg-white border border-border rounded-xl p-6 animate-fade-in space-y-6">
              <h2 className="text-lg font-semibold">Payment</h2>
              <div className="bg-surface rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><CreditCard size={28} className="text-primary" /></div>
                <div>
                  <h3 className="text-base font-semibold">Pay securely with Razorpay</h3>
                  <p className="text-sm text-muted">UPI, Cards, Net Banking, Wallets</p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted mb-1">Final Amount</p>
                  <p className="text-3xl font-bold text-primary">{formatPrice(total)}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setCurrentStep(1)} className="flex-1 py-3.5 border border-border rounded-full font-medium">Back</button>
                <button onClick={handlePlaceOrder} disabled={loading} className="flex-1 py-3.5 bg-primary text-white rounded-full font-semibold flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} {loading ? 'Processing...' : 'Place Order & Pay'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-white border border-border rounded-xl p-6 sticky top-24 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
              {items.map(item => (
                <div key={item.variantId} className="flex gap-3">
                  <img src={item.productImage || 'https://placehold.co/80'} alt="" className="w-12 h-14 bg-surface rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.productName}</p>
                    <p className="text-[10px] text-muted">{item.variantSize} / {item.variantColor} × {item.quantity}</p>
                    <p className="text-xs font-bold mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="border-t border-border pt-4 mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                  <input type="text" placeholder="Coupon Code" value={couponCode} onChange={e => setCouponCode(e.target.value)} disabled={!!appliedCoupon}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-xs uppercase focus:border-primary focus:outline-none disabled:bg-surface" />
                </div>
                {appliedCoupon ? (
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                ) : (
                  <button onClick={handleApplyCoupon} disabled={!couponCode || loading} className="px-4 py-2 bg-foreground text-white rounded-lg text-xs font-semibold">Apply</button>
                )}
              </div>
              {appliedCoupon && <p className="text-[10px] text-success font-medium mt-1.5 flex items-center gap-1"><Check size={10} /> Coupon "{appliedCoupon.code}" applied</p>}
            </div>

            <div className="space-y-2 text-sm pt-4 border-t border-dashed border-border">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(subtotal())}</span></div>
              <div className="flex justify-between"><span className="text-muted">Delivery</span><span className={deliveryCharge === 0 ? 'text-success' : ''}>{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span className="text-success">-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-border text-primary">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
