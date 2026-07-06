/**
 * Product Specifications Component
 */

import type { Product } from '../product-detail.types';

interface ProductSpecificationsProps {
  specifications: Record<string, string>;
  className?: string;
}

export function ProductSpecifications({
  specifications,
  className,
}: ProductSpecificationsProps) {
  const entries = Object.entries(specifications);

  if (entries.length === 0) {
    return (
      <div className={className}>
        <p className="text-secondary-500">Tidak ada informasi spesifikasi</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <table className="w-full">
        <tbody>
          {entries.map(([key, value], index) => (
            <tr
              key={key}
              className={index % 2 === 0 ? 'bg-secondary-50' : 'bg-white'}
            >
              <td className="px-4 py-3 text-sm font-medium text-secondary-700">
                {key}
              </td>
              <td className="px-4 py-3 text-sm text-secondary-600">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
