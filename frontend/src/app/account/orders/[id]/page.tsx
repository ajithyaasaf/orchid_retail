'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, Truck, CheckCircle, Clock, MapPin, CreditCard, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import Link from 'next/link';

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrder = async () => {
      try {
        const res = await orderApi.getById(orderId) as any;
        setOrder(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-muted text-sm">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle size={48} className="text-error mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Order not found</h1>
        <p className="text-sm text-muted mb-6">{error || 'The requested order could not be found.'}</p>
        <Link href="/account/orders" className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-muted">Order #{order.orderNumber}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Tracking Status */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Truck size={18} className="text-primary" /> Tracking Status
            </h3>
            <div className="relative flex justify-between">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                return (
                  <div key={step.id} className="flex flex-col items-center z-10 w-1/5">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors',
                      isCompleted ? 'bg-primary text-white' : 'bg-surface text-muted',
                      isCurrent && 'ring-4 ring-primary/20'
                    )}>
                      <step.icon size={16} />
                    </div>
                    <span className={cn('text-[10px] md:text-xs font-medium text-center', isCompleted ? 'text-foreground' : 'text-muted')}>
                      {step.label}
                    </span>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={cn(
                        'absolute h-0.5 top-4 -z-10',
                        'w-[20%]', // Approximate width between steps
                        i === 0 ? 'left-[10%]' : i === 1 ? 'left-[30%]' : i === 2 ? 'left-[50%]' : 'left-[70%]',
                        i < currentStatusIndex ? 'bg-primary' : 'bg-border'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-4">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 py-4 first:pt-0 border-b border-border last:border-0 last:pb-0">
                  <img src={item.productImage || 'https://placehold.co/100'} alt="" className="w-20 h-24 bg-surface rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                      <Link href={`/product/${item.productSlug}`}>{item.productName}</Link>
                    </h4>
                    <p className="text-xs text-muted mt-1">{item.variantSize} · {item.variantColor}</p>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted">Qty: {item.quantity}</p>
                      <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between text-muted"><span>Shipping</span><span>{formatPrice(order.shippingCharges)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border mt-2">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
            <div className={cn(
              'mt-4 p-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider',
              order.paymentStatus === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            )}>
              {order.paymentStatus === 'paid' ? 'Paid via Razorpay' : 'Payment Pending'}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Shipping to
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-bold">{order.shippingAddress.name}</p>
              <p className="text-muted">{order.shippingAddress.phone}</p>
              <p className="text-muted mt-2">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p className="text-muted">{order.shippingAddress.addressLine2}</p>}
              <p className="text-muted">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
