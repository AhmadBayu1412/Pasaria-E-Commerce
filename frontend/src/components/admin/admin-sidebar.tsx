'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAVIGATION, type AdminNavItem } from '@/lib/admin/navigation';

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (item: AdminNavItem) => {
    if (!item.href) return false;
    if (item.href === '/admin') return pathname === '/admin';
    return pathname.startsWith(item.href);
  };

  const renderNavItem = (item: AdminNavItem) => {
    const active = isActive(item);

    return (
      <div key={item.id}>
        <Link
          href={item.href || '#'}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
            ${active
              ? 'bg-primary-100 text-primary-700'
              : 'text-secondary-600 hover:bg-secondary-100'
            }
          `}
        >
          <NavIcon name={item.icon} className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>

        {item.children && active && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.id}
                href={child.href}
                className="block px-4 py-2 text-sm text-secondary-600 hover:text-secondary-900 rounded"
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-secondary-200 h-full">
      <div className="p-4 border-b border-secondary-200">
        <h1 className="text-xl font-bold text-primary-600">Pasaria Admin</h1>
      </div>
      <nav className="p-4 space-y-2">
        {ADMIN_NAVIGATION.map(renderNavItem)}
      </nav>
    </aside>
  );
}

function NavIcon({ name, className }: { name: string; className?: string }): React.ReactElement | null {
  const icons: Record<string, React.ReactElement> = {
    home: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    'shopping-bag': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    package: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    users: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  };

  return icons[name] || null;
}
