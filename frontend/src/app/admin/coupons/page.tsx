'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Plus, Tag } from 'lucide-react';

interface CouponData {
  id: string; code: string; type: string; value: number;
  minOrder?: number; maxDiscount?: number; usageLimit?: number;
  usedCount: number; validFrom: string; validUntil: string; isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getCoupons()
      .then((res: unknown) => { const r = res as { data: CouponData[] }; setCoupons(r.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Tag size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No coupons yet</p>
          <p className="text-sm text-muted">Create a coupon to offer discounts to your customers.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => (
            <div key={coupon.id} className="bg-white rounded-xl p-5 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary tracking-wider">{coupon.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${coupon.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-foreground font-medium mb-2">
                {coupon.type === 'flat' ? `₹${coupon.value} OFF` : `${coupon.value}% OFF`}
                {coupon.maxDiscount && ` (max ₹${coupon.maxDiscount})`}
              </p>
              {coupon.minOrder && <p className="text-xs text-muted">Min order: {formatPrice(coupon.minOrder)}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted">{coupon.usedCount}/{coupon.usageLimit || '∞'} used</span>
                <span className="text-xs text-muted">
                  Valid till {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
