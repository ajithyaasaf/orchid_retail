'use client';

import { FolderOpen, Plus, Edit } from 'lucide-react';

const CATEGORIES = [
  { name: "Women's Tops", slug: 'women-tops', isActive: true },
  { name: "Women's Dresses", slug: 'women-dresses', isActive: true },
  { name: "Women's Bottoms", slug: 'women-bottoms', isActive: true },
  { name: "Men's Shirts", slug: 'men-shirts', isActive: true },
  { name: "Men's Trousers", slug: 'men-trousers', isActive: true },
  { name: "Kids' Wear", slug: 'kids-wear', isActive: true },
  { name: 'Accessories', slug: 'accessories', isActive: true },
  { name: 'Footwear', slug: 'footwear', isActive: true },
];

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => (
              <tr key={cat.slug} className="border-b border-border hover:bg-surface/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderOpen size={14} className="text-primary" />
                    </div>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{cat.slug}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success">Active</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 hover:bg-surface rounded-lg transition-colors"><Edit size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
