'use client';

import React from 'react';
import type { OrderStatus } from '@/types/api/order.types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/services/order.service';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const label = ORDER_STATUS_LABELS[status] || status;
  const colorClass = ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
}

interface OrderStatusStepProps {
  currentStatus: OrderStatus;
}

const STATUS_ORDER: OrderStatus[] = [
  'DRAFT',
  'WAITING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
];

const STATUS_STEP_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Pesanan Dibuat',
  WAITING_PAYMENT: 'Menunggu Bayar',
  PAID: 'Sudah Bayar',
  PROCESSING: 'Diproses',
  SHIPPING: 'Dikirim',
  DELIVERED: 'Tiba',
  COMPLETED: 'Selesai',
  EXPIRED: 'Kadaluarsa',
  CANCELLED: 'Dibatalkan',
};

export function OrderStatusStepper({ currentStatus }: OrderStatusStepProps) {
  // If cancelled or expired, show single state
  if (currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') {
    return (
      <div className="flex items-center gap-2">
        <OrderStatusBadge status={currentStatus} size="lg" />
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <React.Fragment key={status}>
            <div
              className={`
                flex flex-col items-center
                ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className="text-xs mt-1 hidden sm:block max-w-[60px] text-center">
                {STATUS_STEP_LABELS[status]}
              </span>
            </div>
            {index < STATUS_ORDER.length - 1 && (
              <div
                className={`w-4 h-0.5 ${
                  index < currentIndex ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
