'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Plus, Tag, Edit, Trash2, X, Loader2 } from 'lucide-react';

interface CouponData {
  id: string; code: string; type: string; value: number;
  minOrder?: number; maxDiscount?: number; usageLimit?: number;
  usedCount: number; validFrom: string; validUntil: string; isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CouponData | null>(null);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', usageLimit: '', validFrom: '', validUntil: '' });
  const [formError, setFormError] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try { const res = await adminApi.getCoupons() as any; setCoupons(res.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', usageLimit: '', validFrom: new Date().toISOString().split('T')[0], validUntil: '' });
    setFormError(''); setShowModal(true);
  };
  const openEdit = (c: CouponData) => {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: String(c.value), minOrder: c.minOrder ? String(c.minOrder) : '', maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', usageLimit: c.usageLimit ? String(c.usageLimit) : '', validFrom: c.validFrom.split('T')[0], validUntil: c.validUntil.split('T')[0] });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value || !form.validFrom || !form.validUntil) { setFormError('Fill all required fields'); return; }
    setSaving(true); setFormError('');
    try {
      const data: Record<string, unknown> = {
        code: form.code.toUpperCase(), type: form.type, value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        validFrom: form.validFrom, validUntil: form.validUntil,
      };
      if (editing) await adminApi.updateCoupon(editing.id, data);
      else await adminApi.createCoupon(data);
      setShowModal(false); fetchCoupons();
    } catch (e: any) { setFormError(e.message || 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (c: CouponData) => {
    const msg = c.usedCount > 0 ? `This coupon has been used ${c.usedCount} times. Delete anyway?` : 'Delete this coupon?';
    if (!confirm(msg)) return;
    try { await adminApi.deleteCoupon(c.id); fetchCoupons(); } catch (e: any) { alert(e.message); }
  };

  const toggleActive = async (c: CouponData) => {
    try { await adminApi.updateCoupon(c.id, { isActive: !c.isActive }); fetchCoupons(); } catch (e) { console.error(e); }
  };

  const isExpired = (c: CouponData) => new Date(c.validUntil) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 skeleton-shimmer rounded-xl" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Tag size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No coupons yet</p>
          <p className="text-sm text-muted">Create a coupon to offer discounts.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => (
            <div key={coupon.id} className={cn('bg-white rounded-xl p-5 shadow-sm border', isExpired(coupon) ? 'border-error/20 opacity-60' : 'border-border')}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary tracking-wider">{coupon.code}</span>
                <div className="flex items-center gap-1">
                  {isExpired(coupon) ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-error/10 text-error">Expired</span>
                  ) : (
                    <button onClick={() => toggleActive(coupon)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer ${coupon.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground font-medium mb-2">
                {coupon.type === 'flat' ? `₹${coupon.value} OFF` : `${coupon.value}% OFF`}
                {coupon.maxDiscount && ` (max ₹${coupon.maxDiscount})`}
              </p>
              {coupon.minOrder && <p className="text-xs text-muted">Min order: {formatPrice(coupon.minOrder)}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted">{coupon.usedCount}/{coupon.usageLimit || '∞'} used</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted mr-2">Till {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <button onClick={() => openEdit(coupon)} className="p-1 hover:bg-surface rounded"><Edit size={12} /></button>
                  <button onClick={() => handleDelete(coupon)} className="p-1 hover:bg-error/10 text-error/60 hover:text-error rounded"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && <div className="p-3 bg-error/10 text-error text-sm rounded-lg">{formError}</div>}
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Coupon Code *</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary font-mono tracking-wider" placeholder="SUMMER20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Value *</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder={form.type === 'percentage' ? '10' : '200'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Min Order (₹)</label>
                  <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="Leave empty for unlimited" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Valid From *</label>
                  <input type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Valid Until *</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-surface">Cancel</button>
              <button onClick={handleSave} disabled={saving} className={cn('px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium', saving ? 'opacity-60' : 'hover:bg-primary-dark')}>
                {saving ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}{editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
