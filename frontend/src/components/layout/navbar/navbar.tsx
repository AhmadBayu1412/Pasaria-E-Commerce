'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import { Search, ShoppingCart, Menu, X, User, Heart, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useUIStore } from '@/store/ui-store';

/**
 * Navbar Component
 *
 * A responsive navigation bar component with modern design.
 */
export function Navbar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Auth state
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = status === 'AUTHENTICATED';

  // Cart badge count
  const cartItemCount = useCartStore((state) => state.items.length);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-secondary-100 shadow-sm',
        className
      )}
    >
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left Section */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:shadow-primary-500/30 transition-shadow">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-secondary-900 hidden sm:block">
                Pasa<span className="text-primary-600">ria</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/">Beranda</NavLink>
              <NavLink href="/products">Produk</NavLink>
              <NavLink href="/categories">Kategori</NavLink>
              <NavLink href="/about">Tentang</NavLink>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 text-sm bg-secondary-50 border border-secondary-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Search - Mobile */}
              <button className="lg:hidden p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <button className="hidden sm:flex p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors relative" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  0
                </span>
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-xl transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-xs">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="max-w-[100px] truncate">{user.email.split('@')[0]}</span>
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-secondary-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-secondary-100">
                        <p className="text-sm font-medium text-secondary-900 truncate">{user.email}</p>
                        <p className="text-xs text-secondary-500 capitalize">{user.role.toLowerCase()}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profil
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Pesanan
                      </Link>
                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await logout();
                          router.push('/');
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Masuk</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-100 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-secondary-50 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </form>

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-1">
              <MobileNavLink href="/">Beranda</MobileNavLink>
              <MobileNavLink href="/products">Produk</MobileNavLink>
              <MobileNavLink href="/categories">Kategori</MobileNavLink>
              <MobileNavLink href="/about">Tentang</MobileNavLink>
            </div>

            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-secondary-100">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{user.email}</p>
                      <p className="text-xs text-secondary-500 capitalize">{user.role.toLowerCase()}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profil
                  </Link>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                      router.push('/');
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Masuk / Daftar</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}

// Desktop NavLink
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
    >
      {children}
    </Link>
  );
}

// Mobile NavLink
function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
