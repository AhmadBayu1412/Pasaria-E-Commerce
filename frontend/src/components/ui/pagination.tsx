'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // Adaptive pagination with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    if (rangeStart > 2) {
      pages.push('...');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-secondary-600">
        Halaman {currentPage} dari {totalPages}
      </p>

      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
        >
          Prev
        </button>

        {pages.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                px-3 py-1 rounded border
                ${
                  page === currentPage
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-secondary-300 hover:bg-secondary-50'
                }
              `}
            >
              {page}
            </button>
          ) : (
            <span key={`ellipsis-${index}`} className="px-2 py-1">
              {page}
            </span>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
