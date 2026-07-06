import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Globe, Send, Phone, MapPin, ArrowRight, MessageCircle, Users, Star, HeartHandshake } from 'lucide-react';

/**
 * Footer Component
 *
 * A modern footer layout with multiple sections.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary-900 text-secondary-300">
      {/* Main Footer */}
      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-bold text-white">
                Pasa<span className="text-primary-400">ria</span>
              </span>
            </Link>
            <p className="text-secondary-400 leading-relaxed max-w-sm">
              Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya untuk semua kebutuhan Anda.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:support@pasaria.com" className="flex items-center gap-3 text-sm hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-secondary-800 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                  <Send className="w-4 h-4 text-primary-400" />
                </div>
                <span>support@pasaria.com</span>
              </a>
              <a href="tel:+622112345678" className="flex items-center gap-3 text-sm hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-secondary-800 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary-400" />
                </div>
                <span>+62 21 1234 5678</span>
              </a>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-secondary-800 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-400" />
                </div>
                <span>Jakarta, Indonesia</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" aria-label="Community" className="w-10 h-10 rounded-xl bg-secondary-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <Users className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Chat" className="w-10 h-10 rounded-xl bg-secondary-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Website" className="w-10 h-10 rounded-xl bg-secondary-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Updates" className="w-10 h-10 rounded-xl bg-secondary-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <Star className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links - Shop */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-sm text-secondary-400 hover:text-white hover:underline-offset-4 hover:underline transition-all flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Semua Produk
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Kategori
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Promo & Diskon
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Produk Baru
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links - Support */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Bantuan</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Pusat Bantuan
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Info Pengiriman
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Pengembalian
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Lacak Pesanan
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links - Company */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Perusahaan</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-secondary-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-800">
        <Container className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-secondary-500">
              © {currentYear} Pasaria. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-secondary-500 hover:text-white transition-colors">
                Privasi
              </Link>
              <Link href="/terms" className="text-secondary-500 hover:text-white transition-colors">
                Ketentuan
              </Link>
              <Link href="/cookies" className="text-secondary-500 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
