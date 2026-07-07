'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'default' | 'critical';
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  message,
  onRetry,
  variant = 'default',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-4',
          variant === 'critical'
            ? 'bg-red-100 text-red-600'
            : 'bg-yellow-100 text-yellow-600',
        )}
      >
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{message}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100
                       rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white
                     rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali
        </Link>
      </div>
    </div>
  );
}
