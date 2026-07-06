'use client';

import { Button } from '@/components/ui';
import type { PaginationProps, PaginationRange } from './pagination.types';

/**
 * Generate pagination range with ellipsis algorithm
 */
function getPaginationRange(currentPage: number, totalPages: number): PaginationRange[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: 'page' as const,
      value: i + 1,
    }));
  }

  const range: PaginationRange[] = [];
  
  // Always show first page
  range.push({ type: 'page', value: 1 });

  if (currentPage > 3) {
    range.push({ type: 'ellipsis' });
  }

  // Show pages around current page
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    range.push({ type: 'page', value: i });
  }

  if (currentPage < totalPages - 2) {
    range.push({ type: 'ellipsis' });
  }

  // Always show last page
  if (totalPages > 1) {
    range.push({ type: 'page', value: totalPages });
  }

  return range;
}

/**
 * Pagination Component
 * 
 * Displays page numbers with ellipsis for large page counts.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = getPaginationRange(currentPage, totalPages);

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      {/* Page numbers */}
      {range.map((item, index) => {
        if (item.type === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-secondary-400">
              ...
            </span>
          );
        }

        return (
          <Button
            key={item.value}
            variant={currentPage === item.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onPageChange(item.value!)}
            aria-label={`Page ${item.value}`}
            aria-current={currentPage === item.value ? 'page' : undefined}
          >
            {item.value}
          </Button>
        );
      })}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </nav>
  );
}
