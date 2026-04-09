'use client';

import { Package, Clock, Truck, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// Mock data — in production, fetched from backend via API
const MOCK_ORDERS = [
  {
    id: '1', orderNumber: 'ORD-2026-000001', orderStatus: 'delivered', paymentStatus: 'paid',
    total: 2499, createdAt: '2026-04-05T10:30:00Z',
    items: [
      { productName: 'Floral Print Blouse', variantSize: 'M', variantColor: 'Pink', quantity: 2, price: 699, productImage: '' },
      { productName: 'Cotton Casual Top', variantSize: 'L', variantColor: 'White', quantity: 1, price: 599, productImage: '' },
    ]
  },
  {
    id: '2', orderNumber: 'ORD-2026-000002', orderStatus: 'shipped', paymentStatus: 'paid',
    total: 1299, createdAt: '2026-04-07T14:15:00Z',
    items: [
      { productName: 'Slim Fit Chinos', variantSize: 'L', variantColor: 'Navy', quantity: 1, price: 1299, productImage: '' },
    ]
  },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={16} className="text-warning" />,
  confirmed: <CheckCircle size={16} className="text-primary" />,
  processing: <Package size={16} className="text-primary" />,
  shipped: <Truck size={16} className="text-blue-500" />,
  delivered: <CheckCircle size={16} className="text-success" />,
};

export default function OrdersPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Order History</h2>

      {MOCK_ORDERS.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-xl">
          <Package size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No orders yet</p>
          <p className="text-sm text-muted">Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {MOCK_ORDERS.map(order => (
            <div key={order.id} className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-surface rounded-full">
                  {STATUS_ICONS[order.orderStatus]}
                  <span className="text-xs font-medium capitalize">{order.orderStatus}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-surface rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted">{item.variantSize} · {item.variantColor} × {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-semibold">Total: {formatPrice(order.total)}</span>
                <button className="text-sm text-primary font-medium hover:underline">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
