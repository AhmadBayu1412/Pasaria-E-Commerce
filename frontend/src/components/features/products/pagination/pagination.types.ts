/**
 * Pagination Types
 */

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface PaginationRange {
  type: 'page' | 'ellipsis' | 'prev' | 'next';
  value?: number;
}
