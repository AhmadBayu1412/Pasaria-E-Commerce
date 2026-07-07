import { SearchX, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

interface SearchEmptyStateProps {
  query: string;
  suggestions?: string[];
}

export function SearchEmptyState({
  query,
  suggestions = [],
}: SearchEmptyStateProps) {
  const defaultSuggestions = [
    'Keyboard Gaming',
    'Keyboard Wireless',
    'Keyboard Mechanical',
    'Mouse Gaming',
    'Headset',
  ];

  const displaySuggestions =
    suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className="py-12 text-center">
      <div
        className="inline-flex items-center justify-center w-20 h-20
                    bg-gray-100 rounded-full mb-6"
      >
        <SearchX className="w-10 h-10 text-gray-400" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Tidak menemukan &quot;{query}&quot;
      </h2>

      <p className="text-gray-500 mb-8">
        Coba gunakan kata kunci lain atau lihat saran kami di bawah ini
      </p>

      <div className="max-w-md mx-auto mb-8">
        <p className="text-sm font-medium text-gray-500 uppercase mb-3">
          Mungkin Anda mencari:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {displaySuggestions.map((suggestion, index) => (
            <Link
              key={index}
              href={`/search?q=${encodeURIComponent(suggestion)}`}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-full
                         text-sm hover:bg-gray-200 transition-colors"
            >
              {suggestion}
              <ArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white
                   rounded-full font-medium hover:bg-primary-700 transition-colors"
      >
        <Home className="w-4 h-4" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}
