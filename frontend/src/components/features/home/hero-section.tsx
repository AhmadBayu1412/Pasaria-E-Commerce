'use client';

/**
 * Hero Section Component
 * Main banner/hero for the homepage
 */

import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Shield, Truck } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-orange-50 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-orange-200/30 rounded-full blur-3xl" />
      </div>

      <Container className="relative py-12 md:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full mb-6">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary-700">
                Marketplace Indonesia Terpercaya
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 leading-tight mb-6">
              Belanja Mudah,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-orange-500">
                Aman & Terpercaya
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-secondary-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Temukan jutaan produk berkualitas dari seller terpercaya.
              Pengiriman cepat ke seluruh Indonesia dengan harga terbaik!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Mulai Belanja
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  Lihat Kategori
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-secondary-600">
                <Shield className="w-5 h-5 text-primary-500" />
                <span>Produk Original</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary-600">
                <Truck className="w-5 h-5 text-primary-500" />
                <span>Pengiriman Cepat</span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="hidden lg:flex justify-center">
            <div className="relative w-full max-w-lg">
              {/* Main card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <span className="text-white font-bold text-2xl">P</span>
                  </div>
                  <div>
                    <p className="font-bold text-secondary-900">Pasaria</p>
                    <p className="text-sm text-secondary-500">Marketplace Pilihan</p>
                  </div>
                </div>

                {/* Mock products */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-secondary-50 rounded-xl p-3">
                      <div className="bg-secondary-200 border-2 border-dashed border-secondary-300 rounded-lg w-full aspect-square mb-2" />
                      <p className="text-xs text-secondary-600 truncate">Produk {i}</p>
                      <p className="text-sm font-semibold text-secondary-900">Rp 150.000</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 animate-bounce">
                <span className="text-2xl">🎉</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-secondary-50"
          />
        </svg>
      </div>
    </section>
  );
}
