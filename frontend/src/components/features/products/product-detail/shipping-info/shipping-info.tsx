'use client';

/**
 * Shipping Info Component
 */

import type { ShippingInfo } from '../product-detail.types';

interface ShippingInfoProps {
  shipping: ShippingInfo;
  className?: string;
}

export function ShippingInfo({ shipping, className }: ShippingInfoProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">📦</span>
        </div>
        <div>
          <p className="font-medium text-secondary-900">
            {shipping.freeShipping ? 'Gratis Ongkir' : 'Ongkir Dihitung'}
          </p>
          <p className="text-sm text-secondary-600">
            Estimasi: {shipping.estimatedDays}
          </p>
        </div>
      </div>
      
      <div className="border-t border-secondary-200 pt-4">
        <table className="w-full text-sm">
          <tbody className="space-y-2">
            <tr>
              <td className="text-secondary-600">Berat</td>
              <td className="text-secondary-900 font-medium text-right">{shipping.weight} kg</td>
            </tr>
            <tr>
              <td className="text-secondary-600">Dimensi</td>
              <td className="text-secondary-900 font-medium text-right">
                {shipping.dimensions.length} x {shipping.dimensions.width} x {shipping.dimensions.height} cm
              </td>
            </tr>
            <tr>
              <td className="text-secondary-600">Kelas</td>
              <td className="text-secondary-900 font-medium text-right">{shipping.shippingClass}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
