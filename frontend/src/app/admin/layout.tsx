'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, FolderOpen, Tag, Users, Layers, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useMemo } from 'react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package, superOnly: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/collections', label: 'Collections', icon: Layers, superOnly: true },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag, superOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const isSuper = user?.role === 'super_admin';

  // Memoize filtered nav to prevent unnecessary re-renders
  const filteredNav = useMemo(() => {
    return NAV.filter(item => !item.superOnly || isSuper);
  }, [isSuper]);

  // Security Guard: If standard admin tries to access superOnly page directly via URL
  useEffect(() => {
    if (user && !isSuper) {
      const currentNav = NAV.find(item => pathname.startsWith(item.href));
      if (currentNav?.superOnly) {
        router.replace('/admin');
      }
    }
  }, [pathname, isSuper, user, router]);

  const isActive = (href: string) => href === '/admin' ? pathname === href : pathname.startsWith(href);

  if (!user) return null; // Let middleware handle guest redirection

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-hero-bg text-white min-h-screen sticky top-0 border-r border-white/5">
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-xl shadow-inner">🌸</div>
              <div>
                <span className="text-sm font-bold tracking-tight">Orchid Retail</span>
                <span className="block text-[10px] text-primary font-semibold tracking-widest uppercase mt-0.5">
                  {isSuper ? 'Super Admin' : 'Administration'}
                </span>
              </div>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Main Menu</span>
            </div>
            {filteredNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive(item.href) 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon size={19} className={cn('transition-transform group-hover:scale-110', isActive(item.href) ? 'text-white' : 'text-gray-500')} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 hover:text-primary transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Storefront
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-border flex justify-around px-2 safe-area-bottom">
          {filteredNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center py-3 px-2 text-[10px] font-semibold transition-all min-w-[60px]',
                isActive(item.href) ? 'text-primary scale-110' : 'text-muted'
              )}
            >
              <item.icon size={20} />
              <span className="mt-1">{item.label}</span>
              {isActive(item.href) && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
            </Link>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 min-h-screen relative">
          <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

