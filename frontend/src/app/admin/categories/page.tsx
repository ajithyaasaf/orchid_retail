'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { cn, generateSlug } from '@/lib/utils';
import { FolderOpen, Plus, Edit, Trash2, ChevronRight, X, Loader2 } from 'lucide-react';

interface CategoryData {
  id: string; name: string; slug: string; description?: string; imageUrl?: string; isActive: boolean; sortOrder: number; parentId?: string;
  children?: CategoryData[];
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CategoryData | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parentId: '', imageUrl: '' });
  const [formError, setFormError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchCategories = async () => {
    setLoading(true);
    try { const res = await adminApi.getCategories() as any; setCategories(res.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const openCreate = (parentId = '') => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', parentId, imageUrl: '' });
    setFormError(''); setShowModal(true);
  };

  const openEdit = (cat: CategoryData) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', parentId: cat.parentId || '', imageUrl: cat.imageUrl || '' });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { setFormError('Name is required'); return; }
    setSaving(true); setFormError('');
    try {
      const data = { name: form.name, slug: form.slug || generateSlug(form.name), description: form.description || null, parentId: form.parentId || null, imageUrl: form.imageUrl || null };
      if (editing) await adminApi.updateCategory(editing.id, data);
      else await adminApi.createCategory(data);
      setShowModal(false); fetchCategories();
    } catch (e: any) { setFormError(e.message || 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try { await adminApi.deleteCategory(id); fetchCategories(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => openCreate()} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {categories.map(parent => (
            <div key={parent.id}>
              <div className="flex items-center border-b border-border hover:bg-surface/50 px-4 py-3">
                <button onClick={() => toggleExpand(parent.id)} className="mr-2 p-1 hover:bg-surface rounded">
                  <ChevronRight size={14} className={cn('transition-transform', expanded.has(parent.id) && 'rotate-90')} />
                </button>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <FolderOpen size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{parent.name}</p>
                  <p className="text-xs text-muted">{parent.slug} · {parent._count?.products || 0} products · {parent.children?.length || 0} subcategories</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openCreate(parent.id)} className="p-1.5 hover:bg-surface rounded-lg text-muted hover:text-primary" title="Add subcategory"><Plus size={14} /></button>
                  <button onClick={() => openEdit(parent)} className="p-1.5 hover:bg-surface rounded-lg"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(parent.id)} className="p-1.5 hover:bg-error/10 text-error/60 hover:text-error rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
              {expanded.has(parent.id) && parent.children?.map(child => (
                <div key={child.id} className="flex items-center border-b border-border hover:bg-surface/50 px-4 py-2.5 pl-14 bg-surface/20">
                  <div className="w-6 h-6 rounded bg-surface flex items-center justify-center mr-3">
                    <FolderOpen size={11} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{child.name}</p>
                    <p className="text-xs text-muted">{child.slug} · {child._count?.products || 0} products</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(child)} className="p-1.5 hover:bg-surface rounded-lg"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(child.id)} className="p-1.5 hover:bg-error/10 text-error/60 hover:text-error rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Category' : 'Add Category'}</h2>
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
                <label className="text-xs font-medium text-muted mb-1 block">Parent Category</label>
                <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white">
                  <option value="">None (Top Level)</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
