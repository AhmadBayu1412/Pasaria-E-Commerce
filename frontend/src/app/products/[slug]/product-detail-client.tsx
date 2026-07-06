'use client';

/**
 * Product Detail Client Component
 * 
 * Interactive components for product detail page.
 */

import { useState, useMemo } from 'react';
import {
  ProductGallery,
  ProductInfo,
  VariantSelector,
  QuantitySelector,
  AddToCartButton,
  ProductTabs,
  ProductSpecifications,
  RelatedProducts,
  ProductBreadcrumb,
  ShippingInfo,
} from '@/components/features/products/product-detail';
import { formatCurrency } from '@/lib/format';
import type { Product, ProductVariant, ProductListItem } from '@/components/features/products/product-detail';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: ProductListItem[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  // Initialize with first available variant or null
  const initialVariant = useMemo(() => {
    if (product.variants.length > 0) {
      return product.variants.find((v) => v.isAvailable) || null;
    }
    return null;
  }, [product.variants]);
  
  // Selected SKU state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(initialVariant);
  
  // Quantity state
  const [quantity, setQuantity] = useState(1);
  
  // Current stock state
  const currentStock = selectedVariant?.stock ?? product.totalStock;
  
  // Add to cart loading state
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Toast state (simple implementation)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle variant selection
  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    
    // Auto-adjust quantity if exceeds new stock
    if (quantity > variant.stock) {
      setQuantity(Math.max(1, variant.stock));
    }
    
    // Show selection feedback
    const variantName = [variant.attributes.color, variant.attributes.size]
      .filter(Boolean)
      .join(' - ');
    showToast(`Varian dipilih: ${variantName}`, 'info');
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedVariant && product.variants.length > 0) {
      showToast('Silakan pilih varian terlebih dahulu', 'error');
      return;
    }

    setIsAddingToCart(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      showToast('Produk ditambahkan ke keranjang', 'success');
      // TODO: Integrate with cart store
    } catch {
      showToast('Gagal menambahkan ke keranjang', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Determine displayed price
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayOriginalPrice = selectedVariant 
    ? (selectedVariant.price < product.price ? product.price : product.originalPrice)
    : product.originalPrice;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      {/* Breadcrumb */}
      <ProductBreadcrumb
        category={product.category}
        productName={product.name}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <ProductGallery
          images={product.images}
          productName={product.name}
        />

        {/* Info & Actions */}
        <div className="space-y-6">
          <ProductInfo product={product} />

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {currentStock > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-700">
                  Stok tersedia ({currentStock})
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-700">Stok habis</span>
              </>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onSelect={handleVariantSelect}
            />
          )}

          {/* Price Display for Variant */}
          {selectedVariant && displayOriginalPrice && displayOriginalPrice > displayPrice && (
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-primary-600">
                {formatCurrency(displayPrice)}
              </span>
              <span className="text-lg text-secondary-400 line-through">
                {formatCurrency(displayOriginalPrice)}
              </span>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-secondary-200">
            <QuantitySelector
              quantity={quantity}
              min={1}
              max={currentStock}
              onChange={setQuantity}
            />

            <AddToCartButton
              onClick={handleAddToCart}
              isLoading={isAddingToCart}
              stock={currentStock}
            />
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <ProductTabs
          description={
            <div className="prose prose-secondary max-w-none">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          }
          specifications={<ProductSpecifications specifications={product.specifications} />}
          shipping={<ShippingInfo shipping={product.shipping} />}
        />
      </div>

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
