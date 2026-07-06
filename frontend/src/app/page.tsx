// Homepage

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Selamat Datang di Pasaria
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya untuk semua kebutuhan Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Mulai Belanja
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Masuk / Daftar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Kategori Populer
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={`/products?category=${category.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex flex-col items-center p-4">
                    <div className="text-4xl mb-2">{category.icon}</div>
                    <span className="text-sm font-medium text-slate-700">{category.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Mengapa Pasaria?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Mulai Belanja Sekarang</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Dapatkan produk berkualitas dengan harga terbaik dan pengiriman ke seluruh Indonesia.
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Lihat Produk
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const categories = [
  { name: 'Elektronik', slug: 'elektronik', icon: '📱' },
  { name: 'Fashion', slug: 'fashion', icon: '👕' },
  { name: 'Rumah Tangga', slug: 'rumah-tangga', icon: '🏠' },
  { name: 'Kecantikan', slug: 'kecantikan', icon: '💄' },
  { name: 'Olahraga', slug: 'olahraga', icon: '⚽' },
  { name: 'Makanan', slug: 'makanan', icon: '🍜' },
];

const features = [
  {
    icon: '🛡️',
    title: 'Aman & Terpercaya',
    description: 'Transaksi aman dengan proteksi lengkap untuk pembeli.',
  },
  {
    icon: '🚚',
    title: 'Pengiriman Cepat',
    description: 'Pengiriman ke seluruh Indonesia dengan berbagai opsi.',
  },
  {
    icon: '💬',
    title: 'Layanan 24/7',
    description: 'Tim support siap membantu kapan saja.',
  },
];
