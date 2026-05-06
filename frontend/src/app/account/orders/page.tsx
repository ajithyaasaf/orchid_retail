'use client';

import { useEffect, useState } from 'react';
import { Package, Clock, Truck, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useGuestId } from '@/lib/useGuestId';
import Link from 'next/link';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={16} className="text-warning" />,
  confirmed: <CheckCircle size={16} className="text-primary" />,
  processing: <Package size={16} className="text-primary" />,
  shipped: <Truck size={16} className="text-blue-500" />,
  delivered: <CheckCircle size={16} className="text-success" />,
};

export default function OrdersPage() {
  const guestId = useGuestId();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!guestId) return;
    
    const fetchOrders = async () => {
      try {
        const res = await orderApi.getUserOrders(guestId) as any;
        setOrders(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [guestId]);

  if (!guestId || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-muted text-sm">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 mb-6 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Order History</h2>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-xl">
          <Package size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No orders yet</p>
          <p className="text-sm text-muted mb-6">Start shopping to see your orders here.</p>
          <Link href="/" className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div>
                  <p className="text-sm font-semibold text-primary">{order.orderNumber}</p>
                  <p className="text-xs text-muted mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
                  order.orderStatus === 'delivered' ? 'bg-success/5 border-success/20 text-success' : 'bg-surface border-border'
                )}>
                  {STATUS_ICONS[order.orderStatus] || <Clock size={16} className="text-muted" />}
                  <span className="text-xs font-medium capitalize">{order.orderStatus}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={item.productImage || 'https://placehold.co/80'} alt="" className="w-12 h-14 bg-surface rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate hover:text-primary cursor-pointer">
                        <Link href={`/product/${item.productSlug || '#'}`}>{item.productName}</Link>
                      </p>
                      <p className="text-xs text-muted">{item.variantSize} · {item.variantColor} <span className="mx-1">|</span> Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-border gap-3">
                <div className="text-sm">
                  <span className="text-muted mr-2">Total Amount:</span>
                  <span className="font-bold text-base">{formatPrice(order.total)}</span>
                  <span className={cn('ml-3 text-xs font-medium px-2 py-0.5 rounded-full', order.paymentStatus === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                    {order.paymentStatus === 'paid' ? 'Paid via Razorpay' : 'Pending Payment'}
                  </span>
                </div>
                <Link href={`/order-success?orderId=${order.id}`} className="text-sm text-primary font-medium hover:underline px-4 py-2 bg-primary/5 rounded-lg text-center">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
