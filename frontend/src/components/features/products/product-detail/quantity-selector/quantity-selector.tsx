'use client';

/**
 * Quantity Selector Component
 * 
 * Quantity input with +/- buttons and bounds.
 */

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
  className?: string;
}

export function QuantitySelector({
  quantity,
  min = 1,
  max = 100,
  onChange,
  className,
}: QuantitySelectorProps) {
  const canDecrement = quantity > min;
  const canIncrement = quantity < max;

  const handleDecrement = () => {
    if (canDecrement) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= min && value <= max) {
      onChange(value);
    } else if (value < min) {
      onChange(min);
    } else if (value > max) {
      onChange(max);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor="quantity" className="text-sm font-medium text-secondary-700">
        Jumlah:
      </label>
      
      <div className="flex items-center border border-secondary-300 rounded-lg overflow-hidden">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          aria-label="Kurangi jumlah"
          aria-disabled={!canDecrement}
          className={cn(
            'p-2 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
            canDecrement
              ? 'hover:bg-secondary-100 text-secondary-700'
              : 'text-secondary-300 cursor-not-allowed'
          )}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Quantity Input */}
        <input
          id="quantity"
          type="number"
          value={quantity}
          onChange={handleInputChange}
          min={min}
          max={max}
          className={cn(
            'w-16 text-center border-x border-secondary-300 py-2',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
          aria-describedby="quantity-description"
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          aria-label="Tambah jumlah"
          aria-disabled={!canIncrement}
          className={cn(
            'p-2 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
            canIncrement
              ? 'hover:bg-secondary-100 text-secondary-700'
              : 'text-secondary-300 cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <span id="quantity-description" className="text-sm text-secondary-500">
        Stok tersedia: {max}
      </span>
    </div>
  );
}
