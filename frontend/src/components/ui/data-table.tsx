'use client';

import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
}

export interface SortConfig {
  key: string;
  order: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  pagination?: PaginationConfig;
  sort?: SortConfig;
  onSort?: (sort: SortConfig) => void;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  pagination,
  sort,
  onSort,
  onRowClick,
  isLoading,
  emptyMessage = 'Tidak ada data',
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;

    if (sort?.key === key) {
      onSort({ key, order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ key, order: 'asc' });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-secondary-100 rounded" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-secondary-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-secondary-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  px-4 py-3 text-left text-sm font-semibold text-secondary-900
                  ${col.sortable ? 'cursor-pointer hover:bg-secondary-50' : ''}
                `}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {col.sortable && sort?.key === col.key && (
                    <span>{sort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className={`
                border-b border-secondary-100 hover:bg-secondary-50
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render
                    ? col.render(row)
                    : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-secondary-600">
            Menampilkan {data.length} dari {pagination.totalItems} data
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
