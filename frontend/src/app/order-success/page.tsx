'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, Package } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<{ id: string; orderNumber: string; paymentStatus: string; orderStatus: string; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) { setLoading(false); setError('No order ID provided'); return; }

    // Poll for order status (frontend never assumes payment success)
    const pollStatus = async () => {
      try {
        const res = await orderApi.getById(orderId) as { data: typeof order };
        setOrder(res.data);
        if (res.data?.paymentStatus === 'pending') {
          setTimeout(pollStatus, 3000); // Poll every 3s while pending
        }
      } catch {
        setError('Failed to fetch order status');
      } finally {
        setLoading(false);
      }
    };
    pollStatus();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 size={48} className="text-primary mx-auto mb-4 animate-spin" />
        <h1 className="text-xl font-semibold mb-2">Checking payment status...</h1>
        <p className="text-sm text-muted">Please wait while we verify your payment.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-20 text-center">
        <XCircle size={48} className="text-error mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted mb-6">{error || 'Order not found'}</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';
  const isPending = order.paymentStatus === 'pending';

  return (
    <div className="container py-16 md:py-20 text-center max-w-lg mx-auto">
      {isPaid ? (
        <>
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Order Confirmed! 🎉</h1>
          <p className="text-muted mb-6">Thank you for shopping with Orchid</p>
        </>
      ) : isPending ? (
        <>
          <Loader2 size={48} className="text-primary mx-auto mb-6 animate-spin" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Processing...</h1>
          <p className="text-muted mb-6">Your payment is being verified. This page will update automatically.</p>
        </>
      ) : (
        <>
          <XCircle size={48} className="text-error mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
          <p className="text-muted mb-6">Your payment could not be processed. Please try again.</p>
        </>
      )}

      <div className="bg-surface rounded-xl p-6 text-left space-y-3 mb-8">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Order Number</span>
          <span className="font-semibold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Order Status</span>
          <span className="font-semibold capitalize">{order.orderStatus}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Payment</span>
          <span className={`font-semibold capitalize ${isPaid ? 'text-success' : isPending ? 'text-warning' : 'text-error'}`}>
            {order.paymentStatus}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-primary">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/account/orders" className="flex-1 py-3 border border-border rounded-full text-sm font-medium hover:bg-surface transition-colors flex items-center justify-center gap-2">
          <Package size={16} /> View Orders
        </Link>
        <Link href="/" className="flex-1 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container py-20 text-center">
        <Loader2 size={48} className="text-primary mx-auto mb-4 animate-spin" />
        <h1 className="text-xl font-semibold mb-2">Loading...</h1>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
