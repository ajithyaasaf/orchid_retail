'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FolderOpen, 
  Tag, 
  Users, 
  Layers, 
  Store,
  Building2,
  ExternalLink,
  ArrowRightLeft,
  Grid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useMemo, useState } from 'react';

const RETAIL_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package, superOnly: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/combos', label: 'Combos', icon: Package, superOnly: true },
  { href: '/admin/collections', label: 'Collections', icon: Layers, superOnly: true },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag, superOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const [wholesaleAdminUrl, setWholesaleAdminUrl] = useState('http://localhost:3001/admin');
  
  const isSuper = user?.role === 'super_admin';

  useEffect(() => {
    checkAuth();
    if (typeof window !== 'undefined') {
      const configured = process.env.NEXT_PUBLIC_WHOLESALE_ADMIN_URL;
      if (configured) {
        setWholesaleAdminUrl(configured);
      } else {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setWholesaleAdminUrl(isLocal ? 'http://localhost:3001/admin' : 'https://orchidhub.in/admin');
      }
    }
  }, [checkAuth]);

  const filteredNav = useMemo(() => {
    return RETAIL_NAV.filter(item => !item.superOnly || isSuper);
  }, [isSuper]);

  // Security Guard for superOnly pages
  useEffect(() => {
    if (user && !isSuper) {
      const activeNav = RETAIL_NAV.find(item => pathname.startsWith(item.href));
      if (activeNav?.superOnly) {
        router.replace('/admin');
      }
    }
  }, [pathname, isSuper, user, router]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted font-medium animate-pulse">Verifying administration access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-hero-bg text-white min-h-screen sticky top-0 border-r border-white/5">
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 border border-white/20">
                <img src="/images/Logo.png" alt="Orchid Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight">Orchid Console</span>
                <span className="block text-[10px] text-primary font-semibold tracking-widest uppercase mt-0.5">
                  Retail Store
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Cross-Store Switcher Pill */}
          <div className="px-3 pt-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>Active Store</span>
                <span className="text-emerald-400 font-mono">orchidwears.com</span>
              </div>

              <a
                href={wholesaleAdminUrl}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-indigo-400" />
                  <span>Wholesale Hub</span>
                </div>
                <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </a>

              <Link
                href="/admin/portal"
                className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <Grid size={12} />
                <span>All Workspaces</span>
              </Link>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Retail Navigation
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-primary/20 text-primary">
                B2C
              </span>
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
                <item.icon size={18} className={cn(
                  'transition-colors',
                  isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-primary'
                )} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 hover:text-primary transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Customer Storefront
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-border flex justify-around px-2 safe-area-bottom">
          {filteredNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center py-2.5 px-2 text-[10px] font-semibold transition-all min-w-[60px]',
                isActive(item.href) ? 'text-primary scale-105' : 'text-muted'
              )}
            >
              <item.icon size={18} />
              <span className="mt-1">{item.label}</span>
              {isActive(item.href) && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
            </Link>
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-h-screen relative">
          <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
            {/* Top Bar Store Switcher Tabs */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              {/* Left Context */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-medium">Workspace:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 shadow-xs">
                    <Store size={13} /> Retail Store (orchidwears.com)
                  </span>
                </div>
              </div>

              {/* Right: Switcher Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-surface border border-border rounded-xl shadow-xs">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-xs">
                    <Store size={13} />
                    <span>Retail</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </span>

                  <a
                    href={wholesaleAdminUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted hover:text-foreground text-xs font-semibold hover:bg-white transition-all group"
                  >
                    <Building2 size={13} className="text-indigo-600" />
                    <span>Wholesale Hub</span>
                    <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                  </a>
                </div>

                <Link
                  href="/admin/portal"
                  className="px-3 py-2 rounded-xl border border-border bg-white hover:bg-surface text-xs font-semibold text-foreground transition-all flex items-center gap-1.5 shadow-xs hover:border-primary/40"
                  title="Choose between Retail and Wholesale"
                >
                  <ArrowRightLeft size={13} className="text-muted" />
                  <span className="hidden sm:inline">All Workspaces</span>
                </Link>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
