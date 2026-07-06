import { Metadata } from 'next';
import { CartPage } from '@/components/features/cart';

export const metadata: Metadata = {
  title: 'Shopping Cart - Pasaria',
  description: 'View and manage your shopping cart',
};

export default function CartRoute() {
  return (
    <main className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-4 py-8">
        <CartPage />
      </div>
    </main>
  );
}
