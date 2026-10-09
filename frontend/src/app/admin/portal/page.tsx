'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  Building2, 
  ArrowRight, 
  ExternalLink, 
  LogOut, 
  Layers, 
  Sparkles,
  ShoppingBag,
  Package,
  Receipt
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function AdminWorkspacePortalPage() {
  const router = useRouter();
  const { user, logout, checkAuth } = useAuthStore();
  const [wholesaleUrl, setWholesaleUrl] = useState('http://localhost:3001/admin');

  useEffect(() => {
    checkAuth();
    if (typeof window !== 'undefined') {
      const configured = process.env.NEXT_PUBLIC_WHOLESALE_ADMIN_URL;
      if (configured) {
        setWholesaleUrl(configured);
      } else {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setWholesaleUrl(isLocal ? 'http://localhost:3001/admin' : 'https://orchidhub.in/admin');
      }
    }
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-lg tracking-wider">
            O
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ORCHID CONSOLE</h1>
            <p className="text-xs text-white/50">Multi-Store Administration Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-white/80">{user.email}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/15 text-white/90">
                {user.role}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Selection Body */}
      <main className="relative z-10 max-w-6xl w-full mx-auto my-auto py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/80 mb-4">
            <Sparkles size={14} className="text-primary" />
            <span>Unified Store Management</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Select Workspace
          </h2>
          <p className="text-base text-white/60">
            Choose the store dashboard you wish to access. You can switch between both workspaces at any time using the header tabs.
          </p>
        </div>

        {/* The Two Main Workspace Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Box 1: Retail Store */}
          <div className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 flex flex-col justify-between">
            <div className="absolute top-6 right-6">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                B2C Retail
              </span>
            </div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-pink-600/30 border border-primary/40 flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform duration-300">
                <Store size={32} />
              </div>

              <div className="space-y-1 mb-4">
                <h3 className="text-2xl font-bold tracking-tight text-white">Retail Store</h3>
                <p className="text-xs font-mono text-primary font-semibold">orchidwears.com</p>
              </div>

              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                Direct-to-consumer apparel store. Manage single-unit products, colors, sizes, customer carts, promotional discount coupons, and online retail orders.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-8 text-xs text-white/60">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                  <ShoppingBag size={14} className="text-primary" />
                  <span>Consumer Orders</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                  <Package size={14} className="text-primary" />
                  <span>Single Garments</span>
                </div>
              </div>
            </div>

            <Link
              href="/admin"
              className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/30 group-hover:translate-y-[-2px]"
            >
              <span>Open Retail Dashboard</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Box 2: Wholesale Hub */}
          <div className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col justify-between">
            <div className="absolute top-6 right-6">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                B2B Wholesale
              </span>
            </div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-105 transition-transform duration-300">
                <Building2 size={32} />
              </div>

              <div className="space-y-1 mb-4">
                <h3 className="text-2xl font-bold tracking-tight text-white">Wholesale Hub</h3>
                <p className="text-xs font-mono text-indigo-400 font-semibold">orchidhub.in</p>
              </div>

              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                Business-to-business apparel portal. Manage pre-packaged bulk bundles, multi-size compositions (XS–5XL), HSN tax codes, and GST sequential tax invoices.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-8 text-xs text-white/60">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                  <Receipt size={14} className="text-indigo-400" />
                  <span>Sequential Invoices</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                  <Layers size={14} className="text-indigo-400" />
                  <span>Bundle Pack Lots</span>
                </div>
              </div>
            </div>

            <a
              href={wholesaleUrl}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 group-hover:translate-y-[-2px]"
            >
              <span>Open Wholesale Dashboard</span>
              <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-white/40 max-w-6xl w-full mx-auto">
        <p>ORCHID Multi-Store Platform • Isolated secure databases with synchronized admin navigation</p>
      </footer>
    </div>
  );
}
