'use client';

import type { OrderStatus } from '@/types/api';
import { getStatusConfig, getTimelineSteps } from '@/lib/orders/order-status';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const steps = getTimelineSteps(currentStatus);
  const config = getStatusConfig(currentStatus);

  const isTerminalState = config.isFinal;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-secondary-900">Status Pesanan</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-secondary-200" />

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.label} className="relative flex items-start gap-4">
              {/* Icon circle */}
              <div
                className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                ${step.level === 'SUCCESS' ? 'bg-green-100 text-green-700' : ''}
                ${step.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${step.level === 'INFO' ? 'bg-blue-100 text-blue-700' : ''}
                ${step.level === 'ERROR' ? 'bg-red-100 text-red-700' : ''}
              `}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="pt-1">
                <p className="font-medium text-secondary-900">{step.label}</p>
                {index === steps.length - 1 && !isTerminalState && (
                  <p className="text-sm text-secondary-500">Status saat ini</p>
                )}
              </div>
            </div>
          ))}

          {/* Show cancelled/expired if applicable */}
          {isTerminalState && (
            <div className="relative flex items-start gap-4">
              <div
                className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                ${config.level === 'ERROR' ? 'bg-red-100 text-red-700' : ''}
                ${config.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700' : ''}
              `}
              >
                {currentStatus === 'CANCELLED' ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
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
                )}
              </div>
              <div className="pt-1">
                <p className="font-medium text-secondary-900">{config.label}</p>
                <p className="text-sm text-secondary-500">Status saat ini</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
