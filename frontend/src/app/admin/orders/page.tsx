'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { OrderStatusBadge } from '@/components/features/orders';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { Order } from '@/types/api';

// Static mock data
const orders: Order[] = [
  {
    id: 1,
    userId: 1,
    status: 'PENDING',
    items: [],
    subtotal: 250000,
    shippingFee: 15000,
    tax: 25000,
    total: 290000,
    totalQuantity: 2,
    createdAt: '2026-07-07T06:30:00.000Z',
    updatedAt: '2026-07-07T06:30:00.000Z',
  },
  {
    id: 2,
    userId: 2,
    status: 'PAID',
    items: [],
    subtotal: 500000,
    shippingFee: 20000,
    tax: 50000,
    total: 570000,
    totalQuantity: 3,
    createdAt: '2026-07-07T04:30:00.000Z',
    updatedAt: '2026-07-07T04:30:00.000Z',
  },
  {
    id: 3,
    userId: 3,
    status: 'PENDING',
    items: [],
    subtotal: 125000,
    shippingFee: 10000,
    tax: 12500,
    total: 147500,
    totalQuantity: 1,
    createdAt: '2026-07-07T01:30:00.000Z',
    updatedAt: '2026-07-07T01:30:00.000Z',
  },
];

export default function AdminOrdersPage() {
  const columns: Column<Order>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      sortable: true,
    },
    {
      key: 'userId',
      header: 'Pelanggan',
      render: (order) => `User #${order.userId}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (order) => formatCurrency(order.total),
    },
    {
      key: 'totalQuantity',
      header: 'Item',
      render: (order) => `${order.totalQuantity} item`,
    },
    {
      key: 'createdAt',
      header: 'Tanggal',
      sortable: true,
      render: (order) => formatDate(order.createdAt),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (order) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-primary-600 hover:underline"
        >
          Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Pesanan</h1>
      </div>

      <div className="bg-white rounded-lg border border-secondary-200">
        <DataTable
          data={orders}
          columns={columns}
          isLoading={false}
          emptyMessage="Tidak ada pesanan"
          onRowClick={(order) => {
            window.location.href = `/admin/orders/${order.id}`;
          }}
        />
      </div>
    </div>
  );
}
