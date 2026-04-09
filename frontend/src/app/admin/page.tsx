'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react';

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Array<{
    id: string; orderNumber: string; total: number; orderStatus: string; paymentStatus: string;
    createdAt: string; user?: { name: string };
  }>;
  topProducts: Array<{ productName: string; totalSold: number; revenue: number }>;
  lowStockAlerts: Array<{ productName: string; sku: string; size: string; color: string; stock: number }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard()
      .then((res: unknown) => { const r = res as { data: DashboardData }; setData(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-xl skeleton-shimmer" />)}</div>
        <div className="grid lg:grid-cols-2 gap-6">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-64 rounded-xl skeleton-shimmer" />)}</div>
      </div>
    );
  }

  const stats = [
    { label: 'Revenue', value: formatPrice(data?.totalRevenue || 0), icon: TrendingUp, color: 'text-success bg-success/10' },
    { label: 'Orders', value: String(data?.totalOrders || 0), icon: ShoppingCart, color: 'text-primary bg-primary/10' },
    { label: 'Products', value: String(data?.totalProducts || 0), icon: Package, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Customers', value: String(data?.totalCustomers || 0), icon: Users, color: 'text-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">{stat.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {(data?.recentOrders || []).slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-muted">{order.user?.name || 'Guest'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    order.paymentStatus === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>{order.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-warning" />
            <h2 className="text-base font-semibold">Low Stock Alerts</h2>
          </div>
          <div className="space-y-3">
            {(data?.lowStockAlerts || []).slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted">{item.sku} · {item.size} · {item.color}</p>
                </div>
                <span className={`text-sm font-bold ${item.stock === 0 ? 'text-error' : 'text-warning'}`}>
                  {item.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      {data?.topProducts && data.topProducts.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Top Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Units Sold</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((tp, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium">{tp.productName}</td>
                    <td className="py-2.5 text-right text-muted">{tp.totalSold}</td>
                    <td className="py-2.5 text-right font-semibold">{formatPrice(tp.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
