'use client';

import { cn } from '@/lib/cn';

type StatusVariant =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusVariant, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Menunggu' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Diproses' },
  paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Dibayar' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Dikirim' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Selesai' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Dibatalkan' },
  refunded: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Dikembalikan' },
  success: { bg: 'bg-green-100', text: 'text-green-700', label: 'Sukses' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Peringatan' },
  error: { bg: 'bg-red-100', text: 'text-red-700', label: 'Error' },
  info: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Info' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className,
      )}
    >
      {label || config.label}
    </span>
  );
}
