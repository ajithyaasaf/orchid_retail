'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { cn, generateSlug } from '@/lib/utils';
import { Plus, Edit, Trash2, Layers, X, Loader2, Image } from 'lucide-react';

interface CollectionData {
  id: string; name: string; slug: string; description?: string; imageUrl?: string;
  isActive: boolean; sortOrder: number;
  _count?: { products: number };
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CollectionData | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', imageUrl: '' });
  const [formError, setFormError] = useState('');

  const fetchCollections = async () => {
    setLoading(true);
    try { const res = await adminApi.getCollections() as any; setCollections(res.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCollections(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', description: '', imageUrl: '' }); setFormError(''); setShowModal(true); };
  const openEdit = (c: CollectionData) => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description || '', imageUrl: c.imageUrl || '' }); setFormError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) { setFormError('Name is required'); return; }
    setSaving(true); setFormError('');
    try {
      const data = { name: form.name, slug: form.slug || generateSlug(form.name), description: form.description || null, imageUrl: form.imageUrl || null };
      if (editing) await adminApi.updateCollection(editing.id, data);
      else await adminApi.createCollection(data);
      setShowModal(false); fetchCollections();
    } catch (e: any) { setFormError(e.message || 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection? Products will not be deleted.')) return;
    try { await adminApi.deleteCollection(id); fetchCollections(); } catch (e: any) { alert(e.message); }
  };

  const toggleActive = async (c: CollectionData) => {
    try { await adminApi.updateCollection(c.id, { isActive: !c.isActive }); fetchCollections(); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> New Collection
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 skeleton-shimmer rounded-xl" />)}</div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Layers size={40} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">No collections yet</p>
          <p className="text-sm text-muted">Create curated product groups for your homepage.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden group">
              <div className="h-32 bg-surface flex items-center justify-center relative">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <Image size={32} className="text-muted" />
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-surface"><Edit size={12} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-error/10 text-error"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{c.name}</h3>
                  <button onClick={() => toggleActive(c)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer ${c.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <p className="text-xs text-muted">{c._count?.products || 0} products · /{c.slug}</p>
                {c.description && <p className="text-xs text-muted mt-1 line-clamp-2">{c.description}</p>}
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
              <h2 className="text-lg font-semibold">{editing ? 'Edit Collection' : 'New Collection'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && <div className="p-3 bg-error/10 text-error text-sm rounded-lg">{formError}</div>}
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Cover Image URL</label>
                <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
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
