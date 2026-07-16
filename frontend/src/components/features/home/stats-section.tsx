'use client';

/**
 * Stats Section
 * Display platform statistics and benefits
 */

import { Container } from '@/components/layout/container';
import { Shield, Truck, CreditCard, Headphones } from 'lucide-react';

const stats = [
  {
    icon: Shield,
    title: 'Produk Original',
    description: 'Jamin produk 100% original',
  },
  {
    icon: Truck,
    title: 'Pengiriman Cepat',
    description: 'Dikirim dalam 1-3 hari kerja',
  },
  {
    icon: CreditCard,
    title: 'Pembayaran Aman',
    description: 'Transaksi aman & terlindungi',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Tim support siap membantu',
  },
];

export function StatsSection() {
  return (
    <section className="py-12 md:py-16 bg-white border-y border-secondary-100">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-2xl flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-secondary-900 mb-1">
                {stat.title}
              </h3>
              <p className="text-sm text-secondary-500">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
