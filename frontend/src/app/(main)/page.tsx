/**
 * Home Page
 * Main landing page with hero, categories, products, and stats sections
 */

import {
  HeroSection,
  FeaturedCategories,
  FeaturedProducts,
  StatsSection,
} from '@/components/features/home';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Banner Section */}
      <HeroSection />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Platform Stats/Benefits */}
      <StatsSection />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-linear-to-br from-primary-600 to-primary-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Siap Memulai Belanja?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Bergabunglah dengan ribuan pengguna yang sudah menemukan produk
            favorit mereka di Pasaria.
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
          >
            Daftar Gratis Sekarang
          </a>
        </div>
      </section>
    </div>
  );
}
