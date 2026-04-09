'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Search, ChevronDown } from 'lucide-react';

interface OrderData {
  id: string; orderNumber: string; total: number;
  orderStatus: string; paymentStatus: string; createdAt: string;
  user?: { name: string; email: string };
  items: Array<{ productName: string; quantity: number; price: number; variantSize: string; variantColor: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-50 text-blue-600',
  processing: 'bg-yellow-50 text-yellow-700',
  shipped: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.getOrders({ status: statusFilter || undefined, limit: 50 })
      .then((res: unknown) => { const r = res as { data: OrderData[] }; setOrders(r.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await adminApi.updateOrder(orderId, { orderStatus: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
    } catch (e) { console.error('Failed to update order:', e); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize',
              statusFilter === status ? 'bg-primary text-white' : 'bg-white border border-border text-foreground hover:border-primary'
            )}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Customer</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-border hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted">{order.items.length} items</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm">{order.user?.name || 'Guest'}</p>
                    <p className="text-xs text-muted">{order.user?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : order.paymentStatus === 'failed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`appearance-none px-2 py-1 rounded-full text-[10px] font-medium cursor-pointer border-0 focus:outline-none ${STATUS_COLORS[order.orderStatus] || ''}`}
                    >
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted hidden md:table-cell">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
