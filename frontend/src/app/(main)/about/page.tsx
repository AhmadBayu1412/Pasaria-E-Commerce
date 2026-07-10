'use client';

/**
 * About Page
 * Route: /about
 */

import { Container } from '@/components/layout/container';

export default function AboutPage() {
  return (
    <div className="bg-secondary-50 min-h-screen">
      <Container>
        <div className="py-12 max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-secondary-900 mb-4">
              Tentang Pasaria
            </h1>
            <p className="text-secondary-600">
              Pasar Indonesia Online - Belanja mudah, aman, dan terpercaya.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Mission */}
            <section className="bg-white rounded-xl border border-secondary-200 p-8">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Misi Kami
              </h2>
              <p className="text-secondary-600 leading-relaxed">
                Pasaria hadir untuk memberikan pengalaman belanja online yang mudah, aman, dan terpercaya
                bagi seluruh masyarakat Indonesia. Kami berkomitmen untuk menyediakan platform yang
                menghubungkan pembeli dengan penjual berkualitas tinggi.
              </p>
            </section>

            {/* Values */}
            <section className="bg-white rounded-xl border border-secondary-200 p-8">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Nilai-Nilai Kami
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h3 className="font-medium text-secondary-900 mb-2">Keamanan</h3>
                  <p className="text-sm text-secondary-500">
                    Transaksi aman dengan enkripsi terbaru
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="font-medium text-secondary-900 mb-2">Kemudahan</h3>
                  <p className="text-sm text-secondary-500">
                    Antarmuka yang intuitif dan mudah digunakan
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <h3 className="font-medium text-secondary-900 mb-2">Terpercaya</h3>
                  <p className="text-sm text-secondary-500">
                    Jaminan kualitas dan layanan pelanggan 24/7
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-white rounded-xl border border-secondary-200 p-8">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Hubungi Kami
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <span>📧</span>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Email</p>
                    <p className="font-medium text-secondary-900">support@pasaria.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <span>📞</span>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Telepon</p>
                    <p className="font-medium text-secondary-900">+62 21 1234 5678</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <span>📍</span>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Alamat</p>
                    <p className="font-medium text-secondary-900">Jakarta, Indonesia</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
