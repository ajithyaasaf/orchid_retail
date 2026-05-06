'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Search, Users, X, Package, MapPin } from 'lucide-react';

interface CustomerData {
  id: string; name: string; email: string; phone?: string; createdAt: string;
  orderCount: number; totalSpent: number;
}

interface CustomerDetail {
  id: string; name: string; email: string; phone?: string; createdAt: string;
  addresses: Array<{ id: string; name: string; phone: string; addressLine1: string; city: string; state: string; pincode: string; isDefault: boolean }>;
  orders: Array<{ id: string; orderNumber: string; total: number; orderStatus: string; paymentStatus: string; createdAt: string; items: any[] }>;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selected, setSelected] = useState<CustomerDetail | null>(null);

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getCustomers({ search: search || undefined, page, limit: 20 }) as any;
      setCustomers(res.data || []); setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openDetail = async (id: string) => {
    try { const res = await adminApi.getCustomer(id) as any; setSelected(res.data); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers <span className="text-base font-normal text-muted">({pagination.total})</span></h1>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Users size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No customers yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Orders</th>
                <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-surface/50 cursor-pointer" onClick={() => openDetail(c.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-xs text-muted hidden md:table-cell">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-surface rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-muted block">Email</span>{selected.email}</div>
                <div><span className="text-xs text-muted block">Phone</span>{selected.phone || '—'}</div>
                <div><span className="text-xs text-muted block">Joined</span>{new Date(selected.createdAt).toLocaleDateString('en-IN')}</div>
                <div><span className="text-xs text-muted block">Orders</span>{selected.orders.length}</div>
              </div>

              {selected.addresses.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted mb-2 flex items-center gap-1"><MapPin size={12} /> Addresses</h3>
                  <div className="space-y-2">
                    {selected.addresses.map(a => (
                      <div key={a.id} className="bg-surface rounded-lg p-3 text-xs">
                        <p className="font-medium">{a.name} {a.isDefault && <span className="text-primary">(Default)</span>}</p>
                        <p className="text-muted">{a.addressLine1}, {a.city}, {a.state} - {a.pincode}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.orders.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted mb-2 flex items-center gap-1"><Package size={12} /> Recent Orders</h3>
                  <div className="space-y-2">
                    {selected.orders.slice(0, 10).map(o => (
                      <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                        <div>
                          <p className="font-medium">{o.orderNumber}</p>
                          <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(o.total)}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${o.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{o.paymentStatus}</span>
                        </div>
                      </div>
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
