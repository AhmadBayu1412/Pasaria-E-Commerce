import { Button } from '@/components/ui';
import Link from 'next/link';

type EmptyStateVariant = 'no-results' | 'no-category' | 'out-of-stock' | 'error';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  searchQuery?: string;
  onRetry?: () => void;
}

/**
 * Empty State Component
 * 
 * Displays different messages based on context.
 */
export function EmptyState({ variant, searchQuery, onRetry }: EmptyStateProps) {
  const content = {
    'no-results': {
      icon: (
        <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6l12 12" />
        </svg>
      ),
      title: 'Tidak ada hasil',
      description: searchQuery
        ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
        : 'Tidak ada produk yang ditemukan',
      action: searchQuery ? (
        <Button variant="outline" onClick={() => window.location.href = '/products'}>
          Clear Search
        </Button>
      ) : null,
    },
    'no-category': {
      icon: (
        <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      title: 'Kategori Kosong',
      description: 'Tidak ada produk dalam kategori ini untuk saat ini.',
      action: (
        <Link href="/products">
          <Button variant="outline">Lihat Semua Produk</Button>
        </Link>
      ),
    },
    'out-of-stock': {
      icon: (
        <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Stok Habis',
      description: 'Produk yang Anda cari sedang kosong. Silakan cek kembali nanti.',
      action: (
        <Button variant="outline">Notify Me</Button>
      ),
    },
    'error': {
      icon: (
        <svg className="w-16 h-16 text-destructive/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: 'Terjadi Kesalahan',
      description: 'Gagal memuat produk. Silakan coba lagi.',
      action: onRetry ? (
        <Button variant="default" onClick={onRetry}>Coba Lagi</Button>
      ) : null,
    },
  };

  const { icon, title, description, action } = content[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon}
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
