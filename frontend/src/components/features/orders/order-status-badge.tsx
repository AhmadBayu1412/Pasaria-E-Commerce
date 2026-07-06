'use client';

import React from 'react';
import type { OrderStatus } from '@/types/api';
import { getStatusConfig, type StatusLevel } from '@/lib/orders/order-status';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Level to Tailwind class mapping
 */
const levelStyles: Record<StatusLevel, { bg: string; text: string }> = {
  INFO: { bg: 'bg-blue-100', text: 'text-blue-700' },
  SUCCESS: { bg: 'bg-green-100', text: 'text-green-700' },
  WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function OrderStatusBadge({
  status,
  size = 'md',
}: OrderStatusBadgeProps) {
  const config = getStatusConfig(status);
  const styles = levelStyles[config.level];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${styles.bg} ${styles.text}
        ${sizeClasses[size]}
      `}
    >
      <StatusIcon name={config.icon} className="w-4 h-4" />
      {config.label}
    </span>
  );
}

function StatusIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}): React.ReactElement | null {
  const icons: Record<string, React.ReactElement> = {
    'file-text': (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    clock: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    'check-circle': (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    'x-circle': (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    'alert-circle': (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  };

  return icons[name] || null;
}
