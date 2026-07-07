'use client';

import { DataTable, type Column } from '@/components/ui/data-table';
import { formatDate } from '@/lib/utils/date';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// Static mock data
const users: AdminUser[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: '2026-06-07T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: '2026-06-22T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Bob Smith',
    email: 'bob@example.com',
    createdAt: '2026-06-30T00:00:00.000Z',
  },
];

export default function AdminUsersPage() {
  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Nama',
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium text-secondary-900">{user.name}</p>
          <p className="text-sm text-secondary-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'createdAt',
      header: 'Bergabung',
      sortable: true,
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (user) => (
        <a
          href={`/admin/users/${user.id}`}
          className="text-primary-600 hover:underline"
        >
          Detail
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Pengguna</h1>
      </div>

      <div className="bg-white rounded-lg border border-secondary-200">
        <DataTable
          data={users}
          columns={columns}
          isLoading={false}
          emptyMessage="Tidak ada pengguna"
          onRowClick={(user) => {
            window.location.href = `/admin/users/${user.id}`;
          }}
        />
      </div>
    </div>
  );
}
