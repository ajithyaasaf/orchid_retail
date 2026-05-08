'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Clock } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Categories are managed via useCategoryStore


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartItems = useCartStore(s => s.totalItems);
  const openCartDrawer = useCartStore(s => s.openDrawer);
  const wishlistCount = useWishlistStore(s => s.items.length);
  const { user, checkAuth } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
    checkAuth();
    fetchCategories();

    // Load recent searches
    const history = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(history);

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Save to history
    const history = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const newHistory = [query, ...history.filter((s: string) => s !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(newHistory));

    // Check for direct category match (includes subcategories)
    let directMatch = categories.find(c => 
      c.name.toLowerCase() === query.toLowerCase() || 
      c.slug.toLowerCase() === query.toLowerCase()
    );

    // If no parent match, check children
    if (!directMatch) {
      for (const parent of categories) {
        const childMatch = parent.children?.find(c => 
          c.name.toLowerCase() === query.toLowerCase() || 
          c.slug.toLowerCase() === query.toLowerCase()
        );
        if (childMatch) {
          directMatch = childMatch;
          break;
        }
      }
    }

    if (directMatch) {
      window.location.href = `/category/${directMatch.slug}`;
    } else {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <>
      {/* Top announcement bar */}
      {!isAdmin && (
        <div className="bg-primary text-white text-center py-1.5 text-xs md:text-sm font-medium tracking-wide">
          🌸 Premium Export Quality Products at Factory Prices — Free Shipping Above ₹999
        </div>
      )}

      {/* Main header */}
      <header
        className={cn(
          'sticky top-0 z-50 bg-white transition-shadow duration-300',
          isScrolled && 'shadow-md'
        )}
      >
        <div className="container flex items-center justify-between h-16 md:h-18">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-110">
              <img src="/images/Logo.png" alt="Orchid Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                Orchid
              </span>
              <span className="block text-[10px] text-muted -mt-1 tracking-widest uppercase">
                Wholesale Orchids
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                Categories
                <ChevronDown size={14} className={cn('transition-transform', isMegaMenuOpen && 'rotate-180')} />
              </button>

              {/* Mega Menu */}
              {isMegaMenuOpen && (
                <div className="absolute top-full left-[-200px] w-[1000px] bg-white shadow-2xl rounded-b-2xl border border-border/50 p-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-5 gap-8">
                    {categories.filter(c => !c.parentId).map(cat => (
                      <div key={cat.id} className="space-y-4">
                        <Link
                          href={`/category/${cat.slug}`}
                          className="block text-sm font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest"
                          onClick={() => setIsMegaMenuOpen(false)}
                        >
                          {cat.name}
                        </Link>
                        <div className="space-y-2">
                          {cat.children?.slice(0, 8).map((child: any) => (
                            <Link
                              key={child.id}
                              href={`/category/${child.slug}`}
                              className="block text-xs text-muted hover:text-primary transition-colors"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              {child.name}
                            </Link>
                          ))}
                          {cat.children && cat.children.length > 8 && (
                            <Link
                              href={`/category/${cat.slug}`}
                              className="block text-[10px] font-bold text-primary/60 hover:text-primary transition-colors underline"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              View All
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {categories.slice(0, 5).map(cat => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors uppercase"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative w-full group">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-full text-sm border border-transparent focus:border-primary focus:bg-white focus:outline-none transition-all shadow-sm"
                />
              </div>
            </form>

            {/* Recent Searches Overlay */}
            {isSearchFocused && recentSearches.length > 0 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSearchFocused(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl rounded-2xl border border-border/50 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} /> Recent Searches
                    </h3>
                    <button
                      onClick={() => {
                        localStorage.removeItem('recentSearches');
                        setRecentSearches([]);
                      }}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(term);
                          window.location.href = `/search?q=${encodeURIComponent(term)}`;
                        }}
                        className="px-3 py-1.5 bg-surface hover:bg-primary/10 hover:text-primary text-xs font-medium rounded-full transition-colors flex items-center gap-2"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Mobile search toggle */}
            <button
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <Search size={22} />
            </button>

            {/* Wishlist */}
            <Link href="/account/wishlist" className="relative p-2 text-foreground hover:text-primary transition-colors">
              <Heart size={22} />
              {mounted && wishlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                  style={{ minWidth: '18px', height: '18px' }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={openCartDrawer}
              className="relative p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={22} />
              {mounted && cartItems() > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                  style={{ minWidth: '18px', height: '18px' }}
                >
                  {cartItems()}
                </span>
              )}
            </button>

            {/* Account */}
            {mounted && user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200",
                    isAccountOpen ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-surface hover:bg-primary-light"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                    isAccountOpen ? "bg-white text-primary" : "bg-primary text-white"
                  )}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={cn("text-xs font-semibold", isAccountOpen ? "text-white" : "text-foreground")}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={cn("transition-transform duration-200", isAccountOpen ? "rotate-180 text-white" : "text-muted")} />
                </button>

                {/* Account Dropdown */}
                {isAccountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAccountOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white shadow-2xl rounded-2xl border border-border/50 py-3 animate-in fade-in zoom-in-95 duration-200 z-50">
                      <div className="px-4 py-2 mb-2 border-b border-border/50">
                        <p className="text-xs text-muted">Signed in as</p>
                        <p className="text-sm font-bold truncate">{user.email}</p>
                      </div>
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setIsAccountOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                          >
                            <span className="text-lg">🛡️</span>
                            Admin Dashboard
                          </Link>
                          <div className="mx-4 my-1 border-t border-border/50" />
                        </>
                      )}

                      <Link href="/account/orders" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface hover:text-primary transition-colors">
                        <ShoppingBag size={16} /> My Orders
                      </Link>
                      <Link href="/account/wishlist" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface hover:text-primary transition-colors">
                        <Heart size={16} /> Wishlist
                      </Link>
                      <div className="mx-4 my-1 border-t border-border/50" />
                      <button
                        onClick={() => {
                          useAuthStore.getState().logout();
                          setIsAccountOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="hidden md:flex p-2 text-foreground hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95">
                <User size={22} />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search bar (expandable) */}
        {isSearchOpen && (
          <div className="md:hidden border-t border-border px-4 py-3 animate-fade-in bg-white shadow-lg">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-sm focus:outline-none border border-transparent focus:border-primary transition-all"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-white animate-fade-in max-h-[70vh] overflow-y-auto">
            <nav className="container py-4 space-y-1">
              {categories.filter(c => !c.parentId).map(cat => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="block px-4 py-3 text-sm font-bold text-foreground hover:text-primary hover:bg-surface rounded-lg transition-colors uppercase"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              <hr className="my-3 border-border" />
              {user && (user.role === 'admin' || user.role === 'super_admin') && (
                <Link
                  href="/admin"
                  className="block px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🛡️ Admin Dashboard
                </Link>
              )}
              <Link
                href="/account/profile"
                className="block px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-surface rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Account
              </Link>
              <Link
                href="/account/orders"
                className="block px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-surface rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Orders
              </Link>
              {user && (
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
