import { Metadata } from 'next';
import { CheckoutPreview } from '@/components/features/cart';

export const metadata: Metadata = {
  title: 'Checkout - Pasaria',
  description: 'Review and complete your order',
};

export default function CheckoutPreviewRoute() {
  return (
    <main className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">
          Checkout
        </h1>
        <CheckoutPreview />
      </div>
    </main>
  );
}
