'use client';

/**
 * Hero Section Component
 * Main banner/hero for the homepage
 */

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Shield, Truck, Star, ShoppingCart } from 'lucide-react';

const HERO_PRODUCTS = [
  {
    name: 'Elektronik',
    price: 'Rp 2.500.000',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    alt: 'Headphone wireless berkualitas tinggi',
  },
  {
    name: 'Fashion Pria',
    price: 'Rp 350.000',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    alt: 'Kaos polos pria cotton premium',
  },
  {
    name: 'Skincare',
    price: 'Rp 180.000',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
    alt: 'Set skincare lengkap untuk harian',
  },
  {
    name: 'Aksesoris',
    price: 'Rp 95.000',
    image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=400&fit=crop',
    alt: 'Tas ransel minimalis untuk sehari-hari',
  },
];

export function HeroSection() {
  return (
    <section className="relative bg-linear-to-br from-primary/5 via-background to-accent-orange-50 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-orange-200/30 rounded-full blur-3xl" />
      </div>

      <Container className="relative py-12 md:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Marketplace Indonesia Terpercaya
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Belanja Mudah,{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent-orange-500">
                Aman &amp; Terpercaya
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <span>Produk Original</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="w-5 h-5 text-primary" />
                <span>Pengiriman Cepat</span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="hidden lg:flex justify-center">
            <div className="relative w-full max-w-lg">
              {/* Main card */}
              <div className="bg-card rounded-3xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-border">
                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <span className="text-white font-bold text-2xl">P</span>

                  </div>
                  <div>
                    <p className="font-bold text-foreground">Pasaria</p>
                    <p className="text-sm text-muted-foreground">Marketplace Pilihan</p>
                  </div>
                </div>

                {/* Mock products */}
                <div className="grid grid-cols-2 gap-4">
                  {HERO_PRODUCTS.map((product) => (
                    <div key={product.name} className="bg-muted rounded-xl p-3">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-background">
                        <Image
                          src={product.image}
                          alt={product.alt}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{product.name}</p>
                      <p className="text-sm font-semibold text-foreground">{product.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-lg p-3 border border-border">
                <Star className="w-6 h-6 text-accent-orange-500 fill-accent-orange-500" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg p-3 border border-border">
                <ShoppingCart className="w-6 h-6 text-primary" />
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
