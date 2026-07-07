'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  variant?: 'default' | 'warning' | 'danger';
}

export function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-white border-secondary-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  const valueStyles = {
    default: 'text-secondary-900',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
  };

  const changeStyles = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-secondary-500',
  };

  return (
    <div className={`rounded-lg border p-6 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-secondary-600">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold mb-1 ${valueStyles[variant]}`}>
        {value}
      </p>
      {change !== undefined && (
        <p className={`text-sm ${changeStyles[trend || 'neutral']}`}>
          {trend === 'up' && '+'}
          {change}% dari kemarin
        </p>
      )}
    </div>
  );
}
