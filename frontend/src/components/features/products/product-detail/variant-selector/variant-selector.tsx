'use client';

/**
 * Variant Selector Component
 * 
 * SKU-based variant selection for product detail page.
 */

import { cn } from '@/lib/cn';
import type { ProductVariant } from '../product-detail.types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
  className?: string;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelect,
  className,
}: VariantSelectorProps) {
  // Extract unique colors and sizes
  const colors = [...new Map(
    variants
      .filter((v) => v.attributes.color)
      .map((v) => [v.attributes.color!, { name: v.attributes.color!, hex: v.attributes.colorHex }])
  ).values()];

  const sizes = [...new Map(
    variants
      .filter((v) => v.attributes.size)
      .map((v) => [v.attributes.size!, v.attributes.size!])
  ).values()];

  // Find variant by color and size
  const findVariant = (color?: string, size?: string): ProductVariant | undefined => {
    return variants.find(
      (v) =>
        v.attributes.color === color &&
        v.attributes.size === size
    );
  };

  // Check if a variant is available
  const isVariantAvailable = (variant: ProductVariant | undefined): boolean => {
    return variant?.isAvailable ?? false;
  };

  // Handle color selection
  const handleColorSelect = (colorName: string) => {
    // Try to keep current size, or pick first available
    const currentSize = selectedVariant?.attributes.size;
    const newVariant = findVariant(colorName, currentSize)
      || findVariant(colorName, sizes.find((s) => isVariantAvailable(findVariant(colorName, s))) || undefined)
      || findVariant(colorName);

    if (newVariant && newVariant.isAvailable) {
      onSelect(newVariant);
    }
  };

  // Handle size selection
  const handleSizeSelect = (sizeName: string) => {
    // Try to keep current color, or pick first available
    const currentColor = selectedVariant?.attributes.color;
    const newVariant = findVariant(currentColor, sizeName)
      || findVariant(colors.find((c) => isVariantAvailable(findVariant(c.name, sizeName)))?.name || undefined, sizeName)
      || findVariant(undefined, sizeName);

    if (newVariant && newVariant.isAvailable) {
      onSelect(newVariant);
    }
  };

  // If no variants, return null
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Warna: {selectedVariant?.attributes.color && (
              <span className="font-normal text-secondary-500">
                {selectedVariant.attributes.color}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pilih warna">
            {colors.map((color) => {
              const variant = findVariant(color.name);
              const isSelected = selectedVariant?.attributes.color === color.name;
              const isAvailable = isVariantAvailable(variant);

              return (
                <button
                  key={color.name}
                  onClick={() => handleColorSelect(color.name)}
                  disabled={!isAvailable}
                  aria-label={`Warna ${color.name}${!isAvailable ? ' (Stok habis)' : ''}`}
                  aria-selected={isSelected}
                  role="radio"
                  className={cn(
                    'w-10 h-10 rounded-full border-2 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    isSelected && 'ring-2 ring-primary-500 ring-offset-2',
                    !isAvailable && 'opacity-50 cursor-not-allowed',
                    color.hex && 'bg-[var(--color)]',
                    !color.hex && 'bg-secondary-300'
                  )}
                  style={color.hex ? { backgroundColor: color.hex } : undefined}
                >
                  {!isAvailable && (
                    <span className="sr-only">Stok habis</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Varian: {selectedVariant?.attributes.size && (
              <span className="font-normal text-secondary-500">
                {selectedVariant.attributes.size}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pilih ukuran">
            {sizes.map((size) => {
              const variant = findVariant(selectedVariant?.attributes.color, size);
              const isSelected = selectedVariant?.attributes.size === size;
              const isAvailable = isVariantAvailable(variant);

              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  disabled={!isAvailable}
                  aria-label={`Ukuran ${size}${!isAvailable ? ' (Stok habis)' : ''}`}
                  aria-selected={isSelected}
                  aria-disabled={!isAvailable}
                  role="radio"
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-secondary-300 text-secondary-700',
                    !isAvailable && 'opacity-50 cursor-not-allowed line-through'
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="text-sm text-secondary-600">
          SKU: <span className="font-mono">{selectedVariant.sku}</span>
        </div>
      )}
    </div>
  );
}
