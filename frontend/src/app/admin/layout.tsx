'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Grid,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useMemo, useState } from 'react';

const RETAIL_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/combos', label: 'Combos', icon: Package, superOnly: true },
  { href: '/admin/collections', label: 'Collections', icon: Layers, superOnly: true },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag, superOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isInitialized, checkAuth } = useAuthStore();
  const [wholesaleAdminUrl, setWholesaleAdminUrl] = useState('https://orchids-main-frontend.vercel.app/admin');
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const isSuper = user?.role === 'super_admin';

  useEffect(() => {
    checkAuth();
    if (typeof window !== 'undefined') {
      const configured = process.env.NEXT_PUBLIC_WHOLESALE_URL || process.env.NEXT_PUBLIC_WHOLESALE_ADMIN_URL;
      if (configured) {
        setWholesaleAdminUrl(configured);
      } else {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setWholesaleAdminUrl(isLocal ? 'http://localhost:3001/admin' : 'https://orchids-main-frontend.vercel.app/admin');
      }
    }
  }, [checkAuth]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const filteredNav = useMemo(() => {
    return RETAIL_NAV.filter(item => !item.superOnly || isSuper);
  }, [isSuper]);

  // Security Guard for superOnly pages (Combos, Collections, Coupons)
  useEffect(() => {
    if (user && !isSuper) {
      const activeNav = RETAIL_NAV.find(item => pathname.startsWith(item.href));
      if (activeNav?.superOnly) {
        window.location.replace('/admin');
      }
    }
  }, [user, isSuper, pathname]);

  // Require admin login
  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!user) {
        window.location.replace('/login?redirect=' + encodeURIComponent(pathname || '/admin'));
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        window.location.replace('/');
      }
    }
  }, [user, isLoading, isInitialized, pathname]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  if (!isInitialized || isLoading || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
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
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* ─── Mobile Sticky Top Header (< md) ─── */}
      <header className="md:hidden sticky top-0 z-40 bg-hero-bg text-white px-4 py-3 flex items-center justify-between border-b border-white/10 shadow-md">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/20 shrink-0">
            <img src="/images/Logo.png" alt="Orchid Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight block leading-tight">Orchid Console</span>
            <span className="text-[9px] text-primary font-bold uppercase tracking-wider block">Retail Store</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/portal"
            className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white transition-colors"
            title="All Workspaces"
          >
            <Grid size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ─── Mobile Drawer Backdrop Overlay ─── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Mobile Slide-out Drawer ─── */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-hero-bg text-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/20 shrink-0">
              <img src="/images/Logo.png" alt="Orchid Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight block">Orchid Console</span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-wider block">Retail Store</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cross Store Switcher in Drawer */}
        <div className="p-3 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span>Active Workspace</span>
              <span className="text-emerald-400 font-mono">orchidwears.com</span>
            </div>
            <a
              href={wholesaleAdminUrl}
              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Building2 size={13} className="text-indigo-400" />
                <span>Wholesale Hub</span>
              </div>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive(item.href)
                  ? 'bg-primary text-white shadow-md shadow-primary/20 font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary transition-colors"
          >
            <span>←</span> Customer Storefront
          </Link>
        </div>
      </div>

      {/* ─── Desktop Sticky & Fixed Sidebar (md:flex) ─── */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-hero-bg text-white border-r border-white/5 h-screen overflow-y-auto select-none">
        {/* Logo Header */}
        <div className="p-5 border-b border-white/10 shrink-0">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/20 shrink-0 group-hover:border-primary/50 transition-colors">
              <img src="/images/Logo.png" alt="Orchid Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block">Orchid Console</span>
              <span className="block text-[10px] text-primary font-bold tracking-widest uppercase mt-0.5">
                Retail Store
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Cross-Store Switcher Card */}
        <div className="px-3 pt-3 shrink-0">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span>Active Store</span>
              <span className="text-emerald-400 font-mono">orchidwears.com</span>
            </div>

            <a
              href={wholesaleAdminUrl}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all flex items-center justify-between group"
              title="Open Wholesale Hub Admin"
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
        
        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Navigation
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
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive(item.href) 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 font-semibold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon size={18} className={cn(
                'transition-colors',
                isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-primary'
              )} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer Link */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <Link 
            href="/" 
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-primary transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Customer Storefront
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Container (md:pl-64 offset) ─── */}
      <main className="flex-1 md:pl-64 min-w-0 flex flex-col min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {/* Top Bar Context */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Workspace:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Store size={13} /> Retail Store (orchidwears.com)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-white border border-border rounded-xl shadow-xs">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-xs">
                  <Store size={13} />
                  <span>Retail</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>

                <a
                  href={wholesaleAdminUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted hover:text-foreground text-xs font-semibold hover:bg-surface transition-all group"
                >
                  <Building2 size={13} className="text-indigo-600" />
                  <span>Wholesale Hub</span>
                  <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                </a>
              </div>

              <Link
                href="/admin/portal"
                className="px-3 py-2 rounded-xl border border-border bg-white hover:bg-surface text-xs font-semibold text-foreground transition-all flex items-center gap-1.5 shadow-xs hover:border-primary/40"
                title="Switch between Retail and Wholesale"
              >
                <ArrowRightLeft size={13} className="text-muted" />
                <span className="hidden sm:inline">Workspaces</span>
              </Link>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
