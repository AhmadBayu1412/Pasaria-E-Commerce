'use client';

import { cn } from '@/lib/cn';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex gap-3 flex-wrap justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                'px-6 py-3 rounded-lg font-medium transition-colors',
                action.variant === 'secondary' &&
                  'bg-gray-100 text-gray-700 hover:bg-gray-200',
                action.variant === 'outline' &&
                  'border border-gray-300 text-gray-700 hover:bg-gray-50',
                (!action.variant || action.variant === 'primary') &&
                  'bg-primary-600 text-white hover:bg-primary-700',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
