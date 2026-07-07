/**
 * Admin Permissions
 * Granular permission system based on actions
 */

/**
 * Admin Role enum
 */
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  WAREHOUSE = 'WAREHOUSE',
  FINANCE = 'FINANCE',
}

/**
 * Permission keys - Granular berbasis aksi
 */
export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': 'Lihat dashboard',
  'dashboard:export': 'Export laporan',

  // Orders
  'orders:read': 'Lihat daftar pesanan',
  'orders:detail': 'Lihat detail pesanan',
  'orders:update-status': 'Update status pesanan',
  'orders:refund': 'Proses refund',
  'orders:cancel': 'Batalkan pesanan',

  // Products
  'products:read': 'Lihat produk',
  'products:create': 'Tambah produk',
  'products:update': 'Edit produk',
  'products:delete': 'Hapus produk',
  'products:publish': 'Publikasi produk',
  'products:archive': 'Arsipkan produk',

  // Users
  'users:read': 'Lihat pengguna',
  'users:detail': 'Lihat detail pengguna',
  'users:export': 'Export data pengguna',
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Role to Permissions mapping
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.keys(PERMISSIONS) as Permission[],
  [AdminRole.ADMIN]: [
    'dashboard:view',
    'orders:read',
    'orders:detail',
    'orders:update-status',
    'orders:refund',
    'orders:cancel',
    'products:read',
    'products:create',
    'products:update',
    'products:publish',
    'users:read',
    'users:detail',
  ],
  [AdminRole.OPERATOR]: [
    'dashboard:view',
    'orders:read',
    'orders:detail',
    'orders:update-status',
    'products:read',
  ],
  [AdminRole.WAREHOUSE]: [
    'dashboard:view',
    'orders:read',
    'orders:detail',
    'orders:update-status',
    'products:read',
    'products:update',
  ],
  [AdminRole.FINANCE]: [
    'dashboard:view',
    'dashboard:export',
    'orders:read',
    'orders:detail',
    'orders:refund',
    'users:read',
    'users:export',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: AdminRole,
  permission: Permission,
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
