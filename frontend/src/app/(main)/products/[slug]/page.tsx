'use client';

/**
 * Product Detail Page
 * Route: /products/[slug]
 */

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { productService } from '@/services/product.service';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/layout/container';
import type { Product as ApiProduct } from '@/types/api';
import { useCartStore } from '@/store/cart.store';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Truck, ShieldCheck, RotateCcw, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const user = useAuthStore((state) => state.user);
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    async function fetchProduct() {
      setIsLoading(true);
      setError(null);

      try {
        const productData = await productService.getProductBySlug(slug);
        if (isMounted) {
          setProduct(productData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat produk'
          );
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: `temp-${product.id}`,
      productId: String(product.id),
      name: product.name,
      slug: product.slug || String(product.id),
      price: product.price,
      currentPrice: product.price,
      quantity,
      image: product.images?.[0]?.url || '',
      stock: product.availableStock || 0,
      isAvailable: product.availableStock > 0,
    });

    openDrawer();
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-secondary-900 mb-2">Produk tidak ditemukan</h1>
          <p className="text-secondary-600 mb-6">Maaf, produk yang Anda cari tidak tersedia.</p>
          <Link href="/products" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Lihat Semua Produk
          </Link>
        </div>
      </Container>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImage] || { url: '/placeholder.svg', alt: product.name };
  const stock = product.availableStock || 0;

  return (
    <div className="bg-secondary-50 min-h-screen pb-12">
      <Container>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm py-4">
          <Link href="/" className="flex items-center text-secondary-500 hover:text-primary-600 transition-colors">
            <Home className="w-4 h-4" />
            <span className="sr-only">Beranda</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-secondary-300" />
          <Link href="/products" className="text-secondary-500 hover:text-primary-600 transition-colors">Produk</Link>
          <ChevronRight className="w-4 h-4 text-secondary-300" />
          <span className="text-secondary-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-xl overflow-hidden border border-secondary-200">
              <img
                src={currentImage.url || '/placeholder.png'}
                alt={currentImage.alt || product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                      idx === selectedImage
                        ? 'border-primary-500 shadow-md'
                        : 'border-secondary-200 hover:border-secondary-300'
                    )}
                  >
                    <img src={img.url || '/placeholder.png'} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">{product.name}</h1>

            {/* Price */}
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary-600">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Stock */}
            <div className="mt-4">
              {stock > 0 ? (
                <span className="text-sm text-green-600 font-medium">Stok tersedia: {stock}</span>
              ) : (
                <span className="text-sm text-red-600 font-medium">Stok habis</span>
              )}
            </div>

            {/* Description */}
            <p className="mt-6 text-secondary-600 leading-relaxed">{product.description}</p>

            {/* Quantity Selector */}
            <div className="mt-8">
              <label className="text-sm font-medium text-secondary-700 mb-2 block">Jumlah</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-secondary-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-secondary-600 hover:bg-secondary-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-15 text-center font-medium text-secondary-700">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    className="px-4 py-2 text-secondary-600 hover:bg-secondary-100 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-secondary-500">Tersisa {stock} unit</span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                  stock > 0
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
              </button>
              <button className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-100 transition-colors">
                <Heart className="w-5 h-5 text-secondary-600" />
              </button>
            </div>

            {/* Shipping Info */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-secondary-50 rounded-lg">
                <Truck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-800">Gratis Ongkir</p>
                  <p className="text-xs text-secondary-500">Pengiriman 2-5 hari kerja</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-secondary-50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-800">Garansi 30 Hari</p>
                  <p className="text-xs text-secondary-500">Jika barang tidak sesuai</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-secondary-50 rounded-lg">
                <RotateCcw className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-800">Pengembalian 7 Hari</p>
                  <p className="text-xs text-secondary-500">Jika produk rusak/salah</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="bg-secondary-50 min-h-screen pb-12">
      <Container>
        <div className="py-4">
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="order-1">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="order-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Container>
    </div>
  );
}
