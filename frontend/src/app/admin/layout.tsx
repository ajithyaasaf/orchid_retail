'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, FolderOpen, Tag, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 bg-hero-bg text-white min-h-screen sticky top-0">
          <div className="p-5 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm">🌸</div>
              <div>
                <span className="text-sm font-bold">Orchid Admin</span>
                <span className="block text-[9px] text-gray-400 tracking-wider uppercase">Management Panel</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-white/10">
            <Link href="/" className="text-xs text-gray-500 hover:text-primary transition-colors">← Back to Store</Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex">
          {NAV.slice(0, 4).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center py-2.5 text-[10px] font-medium transition-colors',
                pathname === item.href ? 'text-primary' : 'text-muted'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
