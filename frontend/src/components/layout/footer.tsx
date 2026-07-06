// Footer Component

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Pasaria</h3>
            <p className="text-sm text-slate-400">
              Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="text-white font-medium mb-4">Layanan</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Produk</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Pesanan</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Bantuan</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Perusahaan</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">Tentang Kami</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Kontak</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Karir</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Pasaria. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
