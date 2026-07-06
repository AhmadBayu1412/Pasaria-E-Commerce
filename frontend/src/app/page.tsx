// Homepage

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Container } from '@/components/layout/container';
import {
  ShieldCheck,
  Truck,
  HeadphonesIcon,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  UtensilsCrossed,
  Trophy,
  ArrowRight,
  Star,
  Package,
  CreditCard,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Modern Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-accent-orange-400/10 rounded-full blur-2xl" />
        </div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>

        <Container className="relative py-24 md:py-32 lg:py-40">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="w-4 h-4 text-accent-orange-400" />
              <span>Marketplace #1 di Indonesia</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              <span className="block">Selamat Datang</span>
              <span className="block mt-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                di Pasaria
              </span>
            </h1>

            <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya untuk semua kebutuhan Anda.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-white !text-primary-700 hover:bg-primary-50 shadow-lg shadow-white/25 hover:shadow-white/40 transition-all duration-300 group"
                >
                  Mulai Belanja
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  Masuk / Daftar
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-12 border-t border-white/10">
              <div className="flex items-center gap-2 text-primary-200">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-medium">100% Aman</span>
              </div>
              <div className="flex items-center gap-2 text-primary-200">
                <Truck className="w-5 h-5" />
                <span className="text-sm font-medium">Pengiriman Cepat</span>
              </div>
              <div className="flex items-center gap-2 text-primary-200">
                <HeadphonesIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Support 24/7</span>
              </div>
            </div>
          </div>
        </Container>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-white" />
          </svg>
        </div>
      </section>

      {/* Categories Section - Modern Cards */}
      <section className="py-20 bg-gradient-to-b from-white to-secondary-50">
        <Container>
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold text-primary-600 bg-primary-50 rounded-full">
              Eksplorasi
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Kategori Populer
            </h2>
            <p className="text-secondary-600 max-w-xl mx-auto">
              Temukan jutaan produk dari berbagai kategori terbaik
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Link key={category.name} href={`/products?category=${category.slug}`}>
                <div className="group relative bg-white rounded-2xl p-6 text-center shadow-sm border border-secondary-100 hover:shadow-xl hover:border-primary-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
                  {/* Hover Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Icon */}
                  <div className="relative z-10 w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary-100 group-hover:bg-primary-100 transition-colors duration-300 flex items-center justify-center">
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                  </div>

                  {/* Label */}
                  <span className="relative z-10 text-sm font-semibold text-secondary-700 group-hover:text-primary-700 transition-colors duration-300">
                    {category.name}
                  </span>

                  {/* Decorative Corner */}
                  <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full bg-primary-500/0 group-hover:bg-primary-500/10 transition-all duration-300" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/categories">
              <Button variant="ghost" className="text-primary-600 hover:text-primary-700 group">
                Lihat Semua Kategori
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Features Section - Why Choose Us */}
      <section className="py-20 bg-secondary-50">
        <Container>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold text-accent-orange-600 bg-accent-orange-50 rounded-full">
              Keunggulan Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Mengapa Pasaria?
            </h2>
            <p className="text-secondary-600 max-w-xl mx-auto">
              Komitmen kami untuk memberikan pengalaman belanja terbaik
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-white rounded-3xl p-8 shadow-sm border border-secondary-100 hover:shadow-2xl hover:border-primary-100 transition-all duration-500 overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon */}
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-500 group-hover:to-primary-600 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-500">
                  <div className="text-3xl group-hover:text-white group-hover:scale-110 transition-all duration-500">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-primary-500/0 group-hover:bg-primary-500/5 transition-all duration-500" />
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-secondary-100">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-secondary-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section - Modern Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-24">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent-orange-400/10 rounded-full blur-2xl" />
        </div>

        {/* Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="cta-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#cta-pattern)" />
          </svg>
        </div>

        <Container className="relative text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Trophy className="w-4 h-4 text-accent-orange-400" />
              <span>Promo Spesial</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Mulai Belanja Sekarang
            </h2>

            <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-xl mx-auto leading-relaxed">
              Dapatkan produk berkualitas dengan harga terbaik dan pengiriman ke seluruh Indonesia.
            </p>

            <Link href="/products">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-primary-50 shadow-xl shadow-white/25 hover:shadow-white/40 transition-all duration-300 group"
              >
                Lihat Produk
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </Container>

        {/* Wave Top */}
        <div className="absolute top-0 left-0 right-0 rotate-180">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-secondary-50" />
          </svg>
        </div>
      </section>
    </div>
  );
}

const categories = [
  { name: 'Elektronik', slug: 'elektronik', icon: <Smartphone className="w-6 h-6 text-primary-600" /> },
  { name: 'Fashion', slug: 'fashion', icon: <Shirt className="w-6 h-6 text-pink-600" /> },
  { name: 'Rumah Tangga', slug: 'rumah-tangga', icon: <Home className="w-6 h-6 text-amber-600" /> },
  { name: 'Kecantikan', slug: 'kecantikan', icon: <Sparkles className="w-6 h-6 text-purple-600" /> },
  { name: 'Olahraga', slug: 'olahraga', icon: <Trophy className="w-6 h-6 text-green-600" /> },
  { name: 'Makanan', slug: 'makanan', icon: <UtensilsCrossed className="w-6 h-6 text-orange-600" /> },
];

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary-600" />,
    title: 'Aman & Terpercaya',
    description: 'Transaksi aman dengan proteksi lengkap untuk pembeli. Data dan privasi Anda selalu terjaga.',
  },
  {
    icon: <Truck className="w-8 h-8 text-primary-600" />,
    title: 'Pengiriman Cepat',
    description: 'Pengiriman ke seluruh Indonesia dengan berbagai opsi pengiriman yang fleksibel dan terpercaya.',
  },
  {
    icon: <HeadphonesIcon className="w-8 h-8 text-primary-600" />,
    title: 'Layanan 24/7',
    description: 'Tim support profesional siap membantu kapan saja melalui berbagai channel komunikasi.',
  },
];

const stats = [
  { value: '1M+', label: 'Pengguna Aktif' },
  { value: '10K+', label: 'Toko Terverifikasi' },
  { value: '100K+', label: 'Produk Tersedia' },
  { value: '4.9', label: 'Rating Aplikasi' },
];
