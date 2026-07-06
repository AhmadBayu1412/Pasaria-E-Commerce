'use client';

/**
 * Cart Drawer Component
 * 
 * Slide-in drawer from navbar with ESC key and focus trap accessibility.
 */

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore, useCartSubtotal, useCartItemCount } from '@/store/cart.store';
import { CartDrawerItem } from './cart-drawer-item';
import { CartDrawerSummary } from './cart-drawer-summary';

interface CartDrawerProps {
  className?: string;
}

export function CartDrawer({ className }: CartDrawerProps) {
  const items = useCartStore((state) => state.items);
  const isDrawerOpen = useCartStore((state) => state.isDrawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const subtotal = useCartSubtotal();
  const itemCount = useCartItemCount();

  const drawerRef = useRef<HTMLDivElement>(null);
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key and focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isDrawerOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeDrawer();
          // Return focus to cart icon
          cartIconRef.current?.focus();
          break;
        case 'Tab':
          // Focus trap
          if (drawerRef.current) {
            const focusableElements = drawerRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
          break;
      }
    },
    [isDrawerOpen, closeDrawer]
  );

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDrawer();
    }
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Focus first element in drawer
      setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Add keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isDrawerOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black/50 transition-opacity',
        isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      onClick={handleOverlayClick}
      aria-hidden={!isDrawerOpen}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl',
          'flex flex-col transform transition-transform',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-secondary-900">
              Cart
            </h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            ref={cartIconRef}
            onClick={closeDrawer}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-secondary-600" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-secondary-400" aria-hidden="true" />
              </div>
              <p className="text-secondary-600 text-center mb-6">
                Your cart is empty
              </p>
              <button
                onClick={closeDrawer}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors',
                  'bg-primary-600 text-white hover:bg-primary-700',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                )}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {items.map((item) => (
                <CartDrawerItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <CartDrawerSummary subtotal={subtotal} onClose={closeDrawer} />
        )}
      </div>
    </div>
  );
}
