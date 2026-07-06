'use client';

import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { cn } from '@/lib/cn';

/**
 * Navbar Component
 * 
 * A responsive navigation bar component.
 */
export function Navbar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-secondary-200',
        className
      )}
    >
      <Container>{children || <DefaultNavbarContent />}</Container>
    </nav>
  );
}

// Default content for the navbar
function DefaultNavbarContent() {
  return (
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center gap-8">
        {/* Logo placeholder */}
        <Link href="/" className="text-xl font-bold text-primary-600">
          Pasaria
        </Link>
        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/products">Products</NavLink>
          <NavLink href="/categories">Categories</NavLink>
          <NavLink href="/about">About</NavLink>
        </div>
      </div>
      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Search placeholder */}
        <button className="p-2 text-secondary-600 hover:text-secondary-900" aria-label="Search">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        {/* Cart placeholder */}
        <button className="p-2 text-secondary-600 hover:text-secondary-900" aria-label="Cart">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-secondary-600" aria-label="Menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// NavLink component
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors"
    >
      {children}
    </Link>
  );
}
