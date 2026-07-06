'use client';

import { Button } from '@/components/ui/button';
import { OrderError as OrderErrorType } from '@/services/order.service';
import { getOrderErrorMessage } from '@/services/order.service';

interface OrderErrorProps {
  error: OrderErrorType;
  onRetry: () => void;
}

export function OrderError({ error, onRetry }: OrderErrorProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-red-600"
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
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        Gagal Memuat
      </h3>
      <p className="text-secondary-600 mb-6">{getOrderErrorMessage(error)}</p>
      <Button onClick={onRetry}>Coba Lagi</Button>
    </div>
  );
}
