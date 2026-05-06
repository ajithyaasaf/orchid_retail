'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { X, Package, Truck, Loader2 } from 'lucide-react';

interface OrderData {
  id: string; orderNumber: string; total: number; subtotal: number; discount: number; deliveryCharge: number;
  orderStatus: string; paymentStatus: string; paymentMethod?: string; createdAt: string;
  trackingNumber?: string; courierName?: string;
  razorpayOrderId?: string; razorpayPaymentId?: string;
  user?: { name: string; email: string; phone?: string };
  shippingAddress?: { name: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string };
  items: Array<{ id: string; productName: string; productImage: string; variantSize: string; variantColor: string; quantity: number; price: number; mrp: number; lineTotal: number; sku: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600', confirmed: 'bg-blue-50 text-blue-600', processing: 'bg-yellow-50 text-yellow-700',
  shipped: 'bg-purple-50 text-purple-600', delivered: 'bg-green-50 text-green-600', cancelled: 'bg-red-50 text-red-600',
};
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'],
  shipped: ['delivered'], delivered: [], cancelled: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', courierName: '' });
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({ status: statusFilter || undefined, limit: 20, page }) as any;
      setOrders(res.data || []); setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await adminApi.updateOrder(orderId, { orderStatus: newStatus, ...trackingForm });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus, ...trackingForm } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, orderStatus: newStatus, ...trackingForm });
    } catch (e) { console.error('Failed to update:', e); }
    setUpdating(false);
  };

  const openDrawer = async (orderId: string) => {
    try {
      const res = await adminApi.getOrder(orderId) as any;
      setSelectedOrder(res.data);
      setTrackingForm({ trackingNumber: res.data.trackingNumber || '', courierName: res.data.courierName || '' });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders <span className="text-base font-normal text-muted">({pagination.total})</span></h1>

      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button key={status} onClick={() => setStatusFilter(status)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize',
              statusFilter === status ? 'bg-primary text-white' : 'bg-white border border-border text-foreground hover:border-primary')}>
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
                <tr key={order.id} className="border-b border-border hover:bg-surface/50 cursor-pointer" onClick={() => openDrawer(order.id)}>
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : order.paymentStatus === 'failed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_COLORS[order.orderStatus] || ''}`}>{order.orderStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted hidden md:table-cell">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchOrders(p)} className={cn('w-8 h-8 rounded-lg text-xs font-medium', p === pagination.page ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary')}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-surface rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-6">
              {/* Status badges */}
              <div className="flex gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[selectedOrder.orderStatus] || ''}`}>{selectedOrder.orderStatus}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{selectedOrder.paymentStatus}</span>
              </div>

              {/* Customer */}
              <div>
                <h3 className="text-xs font-medium text-muted mb-2">Customer</h3>
                <p className="text-sm font-medium">{selectedOrder.user?.name || 'Guest'}</p>
                <p className="text-xs text-muted">{selectedOrder.user?.email} · {selectedOrder.user?.phone}</p>
              </div>

              {/* Shipping */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="text-xs font-medium text-muted mb-2">Shipping Address</h3>
                  <div className="text-sm">
                    <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                    <p className="text-muted">{selectedOrder.shippingAddress.addressLine1}</p>
                    {selectedOrder.shippingAddress.addressLine2 && <p className="text-muted">{selectedOrder.shippingAddress.addressLine2}</p>}
                    <p className="text-muted">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                    <p className="text-muted">{selectedOrder.shippingAddress.phone}</p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="text-xs font-medium text-muted mb-2">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-14 bg-surface rounded-lg overflow-hidden shrink-0">
                        <img src={item.productImage || 'https://placehold.co/96x112/f5f5f5/E8007A?text=P'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted">{item.variantSize} / {item.variantColor} · {item.sku}</p>
                        <p className="text-xs">{formatPrice(item.price)} × {item.quantity} = <span className="font-semibold">{formatPrice(item.lineTotal)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="bg-surface rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span className="text-success">-{formatPrice(selectedOrder.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{selectedOrder.deliveryCharge === 0 ? 'FREE' : formatPrice(selectedOrder.deliveryCharge)}</span></div>
                <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total</span><span className="text-primary">{formatPrice(selectedOrder.total)}</span></div>
                {selectedOrder.razorpayPaymentId && <p className="text-[10px] text-muted mt-1">Payment ID: {selectedOrder.razorpayPaymentId}</p>}
              </div>

              {/* Update status */}
              {VALID_TRANSITIONS[selectedOrder.orderStatus]?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted">Update Status</h3>
                  {selectedOrder.orderStatus === 'processing' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Tracking #</label>
                        <input value={trackingForm.trackingNumber} onChange={e => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                          className="w-full px-2.5 py-2 border border-border rounded-lg text-xs focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Courier</label>
                        <input value={trackingForm.courierName} onChange={e => setTrackingForm({ ...trackingForm, courierName: e.target.value })}
                          className="w-full px-2.5 py-2 border border-border rounded-lg text-xs focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {VALID_TRANSITIONS[selectedOrder.orderStatus].map(status => (
                      <button key={status} onClick={() => handleStatusUpdate(selectedOrder.id, status)} disabled={updating}
                        className={cn('flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors capitalize',
                          status === 'cancelled' ? 'border border-error text-error hover:bg-error/10' : 'bg-primary text-white hover:bg-primary-dark')}>
                        {updating ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}{status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
