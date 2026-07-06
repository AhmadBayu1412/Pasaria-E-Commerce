'use client';

/**
 * Checkout Preview Component
 * 
 * Backend as source of truth for pricing and totals.
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, Truck, CreditCard, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore, useCartSubtotal } from '@/store/cart.store';
import { cartService } from '@/services/cart.service';
import type { Address, ShippingOption, CheckoutPreview as CheckoutPreviewType } from '@/store/cart.types';

export function CheckoutPreview() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartSubtotal();
  const checkoutPreview = useCartStore((state) => state.checkoutPreview);
  const setCheckoutPreview = useCartStore((state) => state.setCheckoutPreview);
  const selectedShipping = useCartStore((state) => state.selectedShipping);
  const setSelectedShipping = useCartStore((state) => state.setSelectedShipping);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load checkout preview data
  useEffect(() => {
    const loadCheckoutData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load addresses
        const addressResponse = await cartService.getAddresses();
        if (addressResponse.success && addressResponse.addresses) {
          setAddresses(addressResponse.addresses);
          const defaultAddress = addressResponse.addresses.find((a) => a.isDefault) || addressResponse.addresses[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          }
        }

        // Load checkout preview from backend (source of truth)
        const previewResponse = await cartService.getCheckoutPreview(selectedAddressId);
        if (previewResponse.success && previewResponse.preview) {
          setCheckoutPreview(previewResponse.preview);
        }
      } catch (err) {
        console.error('Failed to load checkout data:', err);
        setError('Gagal memuat data checkout');
      } finally {
        setIsLoading(false);
      }
    };

    if (items.length > 0) {
      loadCheckoutData();
    }
  }, [items.length, selectedAddressId]);

  // Load shipping options when address changes
  useEffect(() => {
    const loadShippingOptions = async () => {
      if (!selectedAddressId) return;

      try {
        const response = await cartService.getShippingOptions(selectedAddressId);
        if (response.success && response.options) {
          setShippingOptions(response.options);
          if (response.options.length > 0 && !selectedShipping) {
            setSelectedShipping(response.options[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load shipping options:', err);
      }
    };

    loadShippingOptions();
  }, [selectedAddressId]);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !selectedShipping) {
      setError('Mohon pilih alamat dan metode pengiriman');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      const response = await cartService.createOrder({
        addressId: selectedAddressId,
        shippingMethodId: selectedShipping.id,
      });

      if (response.success && response.orderId) {
        router.push(`/checkout/order-created?order_id=${response.orderId}`);
      } else {
        setError(response.message || 'Gagal membuat pesanan');
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      setError('Terjadi kesalahan saat membuat pesanan');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const total = selectedShipping ? subtotal + selectedShipping.price : subtotal;

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-600">Keranjang belanja kosong</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Address & Shipping */}
      <div className="lg:col-span-2 space-y-6">
        {/* Address Section */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-secondary-900">
              Alamat Pengiriman
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
            </div>
          ) : addresses.length === 0 ? (
            <p className="text-secondary-500 py-4">
              belum ada alamat. Silakan tambahkan di profil Anda.
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                    selectedAddressId === address.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-secondary-900">{address.recipientName}</p>
                    <p className="text-sm text-secondary-600">{address.phone}</p>
                    <p className="text-sm text-secondary-500 mt-1">
                      {address.address}, {address.city} {address.postalCode}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Shipping Section */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-5 h-5 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-secondary-900">
              Metode Pengiriman
            </h2>
          </div>

          {shippingOptions.length === 0 ? (
            <p className="text-secondary-500 py-4">
              Pilih alamat terlebih dahulu
            </p>
          ) : (
            <div className="space-y-3">
              {shippingOptions.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                    selectedShipping?.id === option.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={option.id}
                      checked={selectedShipping?.id === option.id}
                      onChange={() => setSelectedShipping(option)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-secondary-900">{option.name}</p>
                      <p className="text-sm text-secondary-500">
                        Estimasi: {option.estimatedDays}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-secondary-900">
                    Rp {option.price.toLocaleString('id-ID')}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-secondary-200 p-6 sticky top-24">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Ringkasan Pesanan
          </h3>

          {/* Items */}
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary-100 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {item.quantity}x Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-secondary-100 pt-4 space-y-3">
            <div className="flex justify-between text-secondary-600">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Shipping</span>
              <span>
                {selectedShipping
                  ? `Rp ${selectedShipping.price.toLocaleString('id-ID')}`
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between border-t border-secondary-100 pt-3">
              <span className="font-semibold text-secondary-900">Total</span>
              <span className="text-xl font-bold text-secondary-900">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !selectedAddressId || !selectedShipping}
            className={cn(
              'w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-all',
              'flex items-center justify-center gap-2',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              isPlacingOrder || !selectedAddressId || !selectedShipping
                ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
            )}
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Place Order</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
              </>
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={() => router.push('/cart')}
            className={cn(
              'w-full mt-3 py-2 px-4 rounded-lg font-medium transition-colors text-center',
              'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          >
            Kembali ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}
