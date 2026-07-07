/**
 * Admin Navigation Configuration
 */

import type { Permission } from './permissions';

/**
 * Navigation item with full properties
 */
export interface AdminNavItem {
  id: string;
  label: string;
  href?: string;
  icon: string;
  permission?: Permission;
  badge?: number;
  children?: AdminNavChild[];
}

/**
 * Navigation child item (no icon required)
 */
export interface AdminNavChild {
  id: string;
  label: string;
  href: string;
  permission?: Permission;
}

export const ADMIN_NAVIGATION: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    icon: 'home',
    permission: 'dashboard:view',
  },
  {
    id: 'orders',
    label: 'Pesanan',
    href: '/admin/orders',
    icon: 'shopping-bag',
    permission: 'orders:read',
    children: [
      { id: 'orders-all', label: 'Semua', href: '/admin/orders' },
      { id: 'orders-pending', label: 'Pending', href: '/admin/orders?status=PENDING' },
      { id: 'orders-paid', label: 'Sudah Bayar', href: '/admin/orders?status=PAID' },
    ],
  },
  {
    id: 'products',
    label: 'Produk',
    href: '/admin/products',
    icon: 'package',
    permission: 'products:read',
    children: [
      { id: 'products-all', label: 'Semua', href: '/admin/products' },
      { id: 'products-active', label: 'Aktif', href: '/admin/products?status=active' },
      { id: 'products-inactive', label: 'Nonaktif', href: '/admin/products?status=inactive' },
      { id: 'products-low-stock', label: 'Stok Rendah', href: '/admin/products?stock=low' },
      { id: 'products-new', label: 'Tambah Produk', href: '/admin/products/new', permission: 'products:create' },
    ],
  },
  {
    id: 'users',
    label: 'Pengguna',
    href: '/admin/users',
    icon: 'users',
    permission: 'users:read',
  },
];
