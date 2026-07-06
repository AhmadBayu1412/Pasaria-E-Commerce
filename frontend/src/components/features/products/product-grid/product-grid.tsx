import type { Product } from '../product-card';
import { ProductCard } from '../product-card';

/**
 * Product Grid Component
 * 
 * Displays products in a responsive grid layout.
 */
export function ProductGrid({
  products,
}: {
  products: Product[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4} // First 4 images are priority
        />
      ))}
    </div>
  );
}
