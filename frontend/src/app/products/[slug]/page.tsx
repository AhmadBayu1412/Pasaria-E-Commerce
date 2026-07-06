import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { fetchProductDetail } from '@/components/features/products/product-detail';
import { ProductDetailClient } from './product-detail-client';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchProductDetail(slug);

  if (!data) {
    return {
      title: 'Produk Tidak Ditemukan - Pasaria',
    };
  }

  const { product } = data;

  return {
    title: `${product.name} - Pasaria`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images.map((img) => ({ url: img.url })),
      type: 'website',
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const data = await fetchProductDetail(slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailClient product={data.product} relatedProducts={data.relatedProducts} />
        </Suspense>
      </div>
    </main>
  );
}

// Loading skeleton
function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-64 bg-secondary-200 rounded mb-6" />
      
      {/* Main content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-secondary-200 rounded-xl" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-16 h-16 bg-secondary-200 rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-24 bg-secondary-200 rounded" />
          <div className="h-8 w-3/4 bg-secondary-200 rounded" />
          <div className="h-4 w-32 bg-secondary-200 rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-secondary-200 rounded-full" />
            <div className="h-6 w-16 bg-secondary-200 rounded-full" />
          </div>
          <div className="h-6 w-48 bg-secondary-200 rounded" />
          <div className="h-10 w-40 bg-secondary-200 rounded" />
        </div>
      </div>
    </div>
  );
}
