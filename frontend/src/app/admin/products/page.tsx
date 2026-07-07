'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency } from '@/lib/utils/currency';
import type { Product } from '@/types/api';

// Static mock data
const products: Product[] = [
  {
    id: 1,
    slug: 'produk-a',
    name: 'Produk A',
    description: 'Deskripsi produk A',
    price: 125000,
    active: true,
    images: [],
    inventory: { stock: 10, reservedStock: 2, availableStock: 8 },
    createdAt: '2026-07-06T00:00:00.000Z',
    updatedAt: '2026-07-06T00:00:00.000Z',
  },
  {
    id: 2,
    slug: 'produk-b',
    name: 'Produk B',
    description: 'Deskripsi produk B',
    price: 250000,
    active: true,
    images: [],
    inventory: { stock: 5, reservedStock: 0, availableStock: 5 },
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z',
  },
  {
    id: 3,
    slug: 'produk-c',
    name: 'Produk C',
    description: 'Deskripsi produk C',
    price: 75000,
    active: false,
    images: [],
    inventory: { stock: 0, reservedStock: 0, availableStock: 0 },
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-04T00:00:00.000Z',
  },
];

export default function AdminProductsPage() {
  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Nama',
      sortable: true,
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-200 rounded" />
          <span className="font-medium">{product.name}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Harga',
      sortable: true,
      render: (product) => formatCurrency(product.price),
    },
    {
      key: 'inventory',
      header: 'Stok',
      render: (product) => {
        const stock = product.inventory.availableStock;
        const variant = stock === 0 ? 'text-red-600' : stock < 5 ? 'text-yellow-600' : 'text-green-600';
        return <span className={variant}>{stock}</span>;
      },
    },
    {
      key: 'active',
      header: 'Status',
      render: (product) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {product.active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (product) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="text-primary-600 hover:underline"
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Produk</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Tambah Produk
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-secondary-200">
        <DataTable
          data={products}
          columns={columns}
          isLoading={false}
          emptyMessage="Tidak ada produk"
          onRowClick={(product) => {
            window.location.href = `/admin/products/${product.id}/edit`;
          }}
        />
      </div>
    </div>
  );
}
