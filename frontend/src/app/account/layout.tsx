'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Heart, MapPin, User, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/returns', label: 'Returns', icon: RotateCcw },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container py-6 md:py-10 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8" style={{ fontFamily: 'var(--font-playfair)' }}>
        My Account
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar nav */}
        <aside className="md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto scrollbar-hide md:overflow-visible">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-surface'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
