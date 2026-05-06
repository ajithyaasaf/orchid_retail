'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2, AlertCircle, Trash2, Edit2, Check } from 'lucide-react';
import { addressApi, AddressData } from '@/lib/api';
import { useGuestId } from '@/lib/useGuestId';
import { cn } from '@/lib/utils';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function AddressesPage() {
  const guestId = useGuestId();
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: 'Tamil Nadu', pincode: '', isDefault: false
  });

  const fetchAddresses = async () => {
    if (!guestId) return;
    try {
      setLoading(true);
      const res = await addressApi.list(guestId);
      setAddresses(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [guestId]);

  const handleAddNew = () => {
    setForm({ name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: 'Tamil Nadu', pincode: '', isDefault: false });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (addr: AddressData) => {
    setForm({
      name: addr.name, phone: addr.phone, addressLine1: addr.addressLine1, 
      addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state, 
      pincode: addr.pincode, isDefault: addr.isDefault
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      setLoading(true);
      await addressApi.delete(id);
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setLoading(true);
      await addressApi.update(id, { isDefault: true, userId: guestId! });
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to set default address');
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const cleanPhone = form.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    return (
      form.name.length >= 3 &&
      /^\d{10}$/.test(cleanPhone) &&
      form.addressLine1.length >= 5 &&
      form.city.length >= 2 &&
      form.state.length > 0 &&
      /^[1-9]\d{5}$/.test(form.pincode)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestId || !isFormValid()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await addressApi.update(editingId, { ...form, userId: guestId });
      } else {
        await addressApi.create({ ...form, userId: guestId });
      }
      setShowForm(false);
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!guestId || loading && addresses.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
        <div className="bg-white border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-muted mb-1.5 block">Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="John Doe" required />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-muted mb-1.5 block">Phone (10-digit) *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="9876543210" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted mb-1.5 block">Address Line 1 *</label>
              <input type="text" value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="House/Flat No, Street" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted mb-1.5 block">Address Line 2 (Optional)</label>
              <input type="text" value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="Landmark, Area" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">City *</label>
              <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">State *</label>
              <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-white" required>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Pincode *</label>
              <input type="text" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value.replace(/\D/g, '').slice(0,6)})} className="w-full px-4 py-3 border border-border rounded-lg text-sm" placeholder="600001" required />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="rounded text-primary focus:ring-primary w-4 h-4" />
              <label htmlFor="isDefault" className="text-sm font-medium">Set as default shipping address</label>
            </div>
            <div className="md:col-span-2 flex gap-3 mt-4 pt-4 border-t border-border">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-border rounded-full font-medium">Cancel</button>
              <button type="submit" disabled={!isFormValid() || isSubmitting} className={cn('px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2', isFormValid() ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400')}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} {isSubmitting ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Saved Addresses</h2>
        <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm">
          <Plus size={16} /> Add New
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-xl">
          <MapPin size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No saved addresses</p>
          <p className="text-sm text-muted">Add an address for faster checkout.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className={cn('bg-white border rounded-xl p-5 relative group transition-colors', addr.isDefault ? 'border-primary shadow-sm' : 'border-border hover:border-primary/30')}>
              {addr.isDefault && <span className="absolute top-4 right-4 text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-primary/10 text-primary rounded-full">Default</span>}
              <p className="font-semibold text-foreground mb-1 pr-16">{addr.name}</p>
              <p className="text-sm text-muted mb-3">{addr.phone}</p>
              <div className="text-sm text-muted space-y-0.5 mb-6">
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button onClick={() => handleEdit(addr)} className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-1.5"><Edit2 size={14} /> Edit</button>
                <div className="w-px h-4 bg-border" />
                <button onClick={() => handleDelete(addr.id)} className="text-sm font-medium text-muted hover:text-error flex items-center gap-1.5"><Trash2 size={14} /> Delete</button>
                {!addr.isDefault && (
                  <>
                    <div className="w-px h-4 bg-border ml-auto" />
                    <button onClick={() => handleSetDefault(addr.id)} className="text-sm font-medium text-primary hover:underline">Set Default</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
