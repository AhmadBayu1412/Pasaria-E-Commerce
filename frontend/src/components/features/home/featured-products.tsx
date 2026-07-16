'use client';

/**
 * Featured Products Section
 * Display featured products on homepage
 */

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/container';
import { productService } from '@/services/product.service';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { cn } from '@/lib/cn';
import type { ProductListItem } from '@/types/api';

export function FeaturedProducts() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const response = await productService.getProducts({ page: 1, limit: 8 });
        setProducts(response.items);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Gagal memuat produk');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-secondary-50">
      <Container>
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-900">
              Produk Populer
            </h2>
            <p className="text-secondary-600 mt-2">
              Produk pilihan dengan harga terbaik
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-secondary-500">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-secondary-500">
            Belum ada produk tersedia
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Mobile "See All" link */}
        <div className="sm:hidden mt-6 text-center">
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              Lihat Semua Produk
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}

interface ProductCardProps {
  product: ProductListItem;
}

function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: `temp-${product.id}`,
      productId: String(product.id),
      name: product.name,
      slug: product.slug,
      price: product.price,
      currentPrice: product.price,
      quantity: 1,
      image: product.primaryImage || '',
      stock: 0,
      isAvailable: product.isAvailable,
    });
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <article className="group bg-white rounded-xl border border-secondary-200 overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-secondary-100">
          {product.primaryImage ? (
            <Image
              src={product.primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-secondary-400 text-lg">No Image</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg text-sm font-medium text-secondary-800 hover:bg-primary-600 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <Heart className="w-4 h-4 text-secondary-600 hover:text-red-500" />
          </button>

          {/* Availability Badge */}
          {!product.isAvailable && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
              Sold Out
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors line-clamp-2 text-sm md:text-base">
            {product.name}
          </h3>
          <p className="mt-2 text-lg font-bold text-primary-600">
            Rp {product.price.toLocaleString('id-ID')}
          </p>
        </div>
      </article>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
}
