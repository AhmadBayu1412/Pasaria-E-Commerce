import Link from 'next/link';
import { Container } from '@/components/layout/container';

/**
 * Footer Component
 * 
 * A simple footer layout component.
 */
export function Footer() {
  return (
    <footer className="bg-secondary-900 text-secondary-300 py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold text-white">
              Pasaria
            </Link>
            <p className="mt-4 text-sm">
              Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Products</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/deals" className="hover:text-white transition-colors">Deals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-700 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Pasaria. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
