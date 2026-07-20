# FRONTEND FILES

---

## `frontend/src/components/features/cart/checkout-preview/checkout-preview.tsx`

```tsx
'use client';

/**
 * Checkout Preview Component - Redesigned
 * Multi-step checkout with address, shipping, and payment method selection
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Truck, CreditCard, ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore, useCartSubtotal } from '@/store/cart.store';
import { cartService } from '@/services/cart.service';
import type { Address, ShippingOption, PaymentMethod } from '@/store/cart.types';

type CheckoutStep = 'address' | 'shipping' | 'payment' | 'confirm';

export function CheckoutPreview() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartSubtotal();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedShippingId, setSelectedShippingId] = useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingCart, setIsSyncingCart] = useState(false);

  // Sync local cart items to backend when entering checkout
  // This ensures backend cart matches local cart before order creation
  useEffect(() => {
    const syncCartToBackend = async () => {
      if (items.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsSyncingCart(true);
      try {
        // Clear backend cart first to ensure fresh sync
        await cartService.clearCart();

        // Add each item to backend cart with exact quantity
        for (const item of items) {
          const productId = parseInt(item.productId) || parseInt(item.id.replace('temp-', ''));
          if (productId) {
            await cartService.addItem({
              productId,
              quantity: item.quantity,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to sync cart to backend:', err);
        // Continue anyway - checkout might still work
      } finally {
        setIsSyncingCart(false);
      }
    };

    syncCartToBackend();
  }, [items.length]);

  // Load checkout data (addresses, shipping, payment)
  useEffect(() => {
    const loadCheckoutData = async () => {
      if (isSyncingCart) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load all data in parallel after cart sync completes
        const [addressRes, shippingRes, paymentRes] = await Promise.all([
          cartService.getAddresses(),
          cartService.getShippingOptions(),
          cartService.getPaymentMethods(),
        ]);

        if (addressRes.success && addressRes.addresses) {
          setAddresses(addressRes.addresses);
          const defaultAddr = addressRes.addresses.find((a) => a.isDefault) || addressRes.addresses[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        }

        if (shippingRes.success && shippingRes.options) {
          setShippingOptions(shippingRes.options);
          if (shippingRes.options.length > 0) {
            setSelectedShippingId(shippingRes.options[0].id);
          }
        }

        if (paymentRes.success && paymentRes.methods) {
          const transformedMethods: PaymentMethod[] = paymentRes.methods.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type as PaymentMethod['type'],
            provider: m.provider,
            icon: m.icon,
            description: m.description,
            fee: m.fee,
            minAmount: m.minAmount,
            maxAmount: m.maxAmount,
          }));
          setPaymentMethods(transformedMethods);
          if (paymentRes.methods.length > 0) {
            setSelectedPaymentId(paymentRes.methods[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load checkout data:', err);
        setError('Gagal memuat data checkout');
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckoutData();
  }, [isSyncingCart]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedShipping = shippingOptions.find((s) => s.id === selectedShippingId);
  const selectedPayment = paymentMethods.find((p) => p.id === selectedPaymentId);

  const shippingCost = selectedShipping?.price || 0;
  const paymentFee = selectedPayment?.fee || 0;
  const total = subtotal + shippingCost + paymentFee;

  const steps: { id: CheckoutStep; label: string; icon: React.ReactNode }[] = [
    { id: 'address', label: 'Alamat', icon: <MapPin className="w-5 h-5" /> },
    { id: 'shipping', label: 'Pengiriman', icon: <Truck className="w-5 h-5" /> },
    { id: 'payment', label: 'Pembayaran', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'confirm', label: 'Konfirmasi', icon: <Check className="w-5 h-5" /> },
  ];

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const goToStep = (step: CheckoutStep) => {
    const targetIndex = steps.findIndex((s) => s.id === step);
    if (targetIndex <= stepIndex || (targetIndex === stepIndex + 1 && canProceed(step))) {
      setCurrentStep(step);
    }
  };

  const canProceed = (step: CheckoutStep): boolean => {
    if (step === 'address') return addresses.length > 0 && !!selectedAddressId;
    if (step === 'shipping') return !!selectedShippingId;
    if (step === 'payment') return !!selectedPaymentId;
    return true;
  };

  const nextStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setError(null);

    try {
      const response = await cartService.completeCheckout({
        selectedShippingId: selectedShippingId,
        selectedPaymentId: selectedPaymentId,
      });

      if (response.success && response.orderId) {
        router.push(`/checkout/success?order_id=${response.orderId}`);
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

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-secondary-400" />
          </div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Keranjang Kosong</h2>
          <p className="text-secondary-500 mb-6">Silakan tambahkan produk ke keranjang terlebih dahulu.</p>
          <button onClick={() => router.push('/products')} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
            Mulai Belanja
          </button>
        </div>
      </div>
    );
  }

  // Show syncing state while cart is being synced to backend
  if (isSyncingCart) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-500">Menyinkronkan keranjang...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-500">Memuat data checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/cart')} className="flex items-center text-secondary-600 hover:text-secondary-900 mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Keranjang
          </button>
          <h1 className="text-3xl font-bold text-secondary-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-secondary-200" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-primary-600 transition-all duration-300"
              style={{ width: `${(stepIndex / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                disabled={index > stepIndex && !canProceed(steps[index].id as CheckoutStep)}
                className={cn(
                  'relative z-10 flex flex-col items-center',
                  index <= stepIndex ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  index < stepIndex ? 'bg-primary-600 text-white' :
                  index === stepIndex ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                  'bg-secondary-200 text-secondary-400'
                )}>
                  {step.icon}
                </div>
                <span className={cn(
                  'mt-2 text-sm font-medium',
                  index <= stepIndex ? 'text-secondary-900' : 'text-secondary-400'
                )}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Address Step */}
            {currentStep === 'address' && (
              <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Alamat Pengiriman</h2>
                    <p className="text-sm text-secondary-500">Pilih alamat pengiriman</p>
                  </div>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                    <p className="text-secondary-500 mb-4">Belum ada alamat tersimpan</p>
                    <button onClick={() => router.push('/profile')} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                      Tambah Alamat di Profil
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={cn(
                          'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-secondary-900">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                Utama
                              </span>
                            )}
                          </div>
                          <p className="text-secondary-900">{address.recipientName}</p>
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
            )}

            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Metode Pengiriman</h2>
                    <p className="text-sm text-secondary-500">Pilih layanan pengiriman</p>
                  </div>
                </div>

                {selectedAddress && (
                  <div className="mb-6 p-4 bg-secondary-50 rounded-xl">
                    <p className="text-sm text-secondary-500 mb-1">Pengiriman ke:</p>
                    <p className="font-medium text-secondary-900">{selectedAddress.recipientName}</p>
                    <p className="text-sm text-secondary-600">{selectedAddress.address}, {selectedAddress.city}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedShippingId === option.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-secondary-300'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipping"
                          value={option.id}
                          checked={selectedShippingId === option.id}
                          onChange={() => setSelectedShippingId(option.id)}
                        />
                        <div>
                          <p className="font-semibold text-secondary-900">{option.name}</p>
                          <p className="text-sm text-secondary-500">{option.estimatedDays}</p>
                        </div>
                      </div>
                      <span className="font-bold text-secondary-900">
                        Rp {option.price.toLocaleString('id-ID')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Metode Pembayaran</h2>
                    <p className="text-sm text-secondary-500">Pilih metode pembayaran</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {['bank_transfer', 'ewallet', 'convenience_store', 'credit_card', 'qr_code'].map((type) => {
                    const methods = paymentMethods.filter((m) => m.type === type);
                    if (methods.length === 0) return null;

                    const typeLabels: Record<string, string> = {
                      bank_transfer: 'Transfer Bank',
                      ewallet: 'E-Wallet',
                      convenience_store: 'Convenience Store',
                      credit_card: 'Kartu Kredit',
                      qr_code: 'QR Code',
                    };

                    return (
                      <div key={type} className="space-y-3">
                        <h3 className="text-sm font-medium text-secondary-500 uppercase tracking-wider">
                          {typeLabels[type] || type}
                        </h3>
                        {methods.map((method) => (
                          <label
                            key={method.id}
                            className={cn(
                              'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
                              selectedPaymentId === method.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-secondary-200 hover:border-secondary-300'
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="radio"
                                name="payment"
                                value={method.id}
                                checked={selectedPaymentId === method.id}
                                onChange={() => setSelectedPaymentId(method.id)}
                              />
                              <div className="w-12 h-12 rounded-lg bg-secondary-100 flex items-center justify-center">
                                <PaymentIcon type={method.type} provider={method.provider} />
                              </div>
                              <div>
                                <p className="font-semibold text-secondary-900">{method.name}</p>
                                <p className="text-sm text-secondary-500">{method.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {method.fee > 0 ? (
                                <span className="font-medium text-secondary-900">
                                  +Rp {method.fee.toLocaleString('id-ID')}
                                </span>
                              ) : (
                                <span className="text-sm text-green-600 font-medium">Gratis</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm Step */}
            {currentStep === 'confirm' && (
              <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Konfirmasi Pesanan</h2>
                    <p className="text-sm text-secondary-500">Periksa kembali pesanan Anda</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedAddress && (
                    <div className="p-4 bg-secondary-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm font-medium text-secondary-500">Alamat Pengiriman</span>
                      </div>
                      <p className="font-medium text-secondary-900">{selectedAddress.recipientName}</p>
                      <p className="text-sm text-secondary-600">{selectedAddress.phone}</p>
                      <p className="text-sm text-secondary-500">
                        {selectedAddress.address}, {selectedAddress.city} {selectedAddress.postalCode}
                      </p>
                    </div>
                  )}

                  {selectedShipping && (
                    <div className="p-4 bg-secondary-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm font-medium text-secondary-500">Metode Pengiriman</span>
                      </div>
                      <p className="font-medium text-secondary-900">{selectedShipping.name}</p>
                      <p className="text-sm text-secondary-500">{selectedShipping.estimatedDays}</p>
                    </div>
                  )}

                  {selectedPayment && (
                    <div className="p-4 bg-secondary-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm font-medium text-secondary-500">Metode Pembayaran</span>
                      </div>
                      <p className="font-medium text-secondary-900">{selectedPayment.name}</p>
                      <p className="text-sm text-secondary-500">{selectedPayment.description}</p>
                    </div>
                  )}

                  <div className="border border-secondary-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-secondary-50 border-b border-secondary-200">
                      <p className="text-sm font-medium text-secondary-700">
                        {items.length} Item dalam Pesanan
                      </p>
                    </div>
                    <div className="divide-y divide-secondary-100 max-h-64 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-secondary-100 overflow-hidden relative shrink-0">
                            {item.image && (
                              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-secondary-900 truncate">{item.name}</p>
                            <p className="text-sm text-secondary-500">{item.quantity}x Rp {item.price.toLocaleString('id-ID')}</p>
                          </div>
                          <p className="font-medium text-secondary-900">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <Shield className="w-6 h-6 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">Pembayaran Aman</p>
                      <p className="text-sm text-green-700">Data Anda terlindungi dengan enkripsi end-to-end</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              {stepIndex > 0 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center px-6 py-3 text-secondary-600 hover:text-secondary-900 font-medium transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Kembali
                </button>
              ) : (
                <div />
              )}

              {stepIndex < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed(steps[stepIndex + 1].id)}
                  className={cn(
                    'flex items-center px-6 py-3 rounded-xl font-semibold transition-all',
                    canProceed(steps[stepIndex + 1].id)
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                  )}
                >
                  Lanjut
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className={cn(
                    'flex items-center px-8 py-3 rounded-xl font-semibold transition-all',
                    isPlacingOrder
                      ? 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/25'
                  )}
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Bayar Sekarang Rp {total.toLocaleString('id-ID')}
                    </>
                  )}
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-secondary-900 mb-6">Ringkasan Pesanan</h3>

              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary-100 overflow-hidden relative shrink-0">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{item.name}</p>
                      <p className="text-xs text-secondary-500">{item.quantity}x</p>
                    </div>
                    <p className="text-sm font-medium text-secondary-900">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-secondary-100 pt-4">
                <div className="flex justify-between text-secondary-600">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-secondary-600">
                  <span>Ongkos Kirim</span>
                  <span>Rp {shippingCost.toLocaleString('id-ID')}</span>
                </div>
                {paymentFee > 0 && (
                  <div className="flex justify-between text-secondary-600">
                    <span>Biaya Admin</span>
                    <span>Rp {paymentFee.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-secondary-100 pt-3">
                  <span className="font-semibold text-secondary-900">Total</span>
                  <span className="text-xl font-bold text-primary-600">
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentIcon({ type, provider }: { type: string; provider: string }) {
  const iconMap: Record<string, { bg: string; text: string }> = {
    BCA: { bg: 'bg-blue-600', text: 'BCA' },
    Mandiri: { bg: 'bg-yellow-500', text: 'MRI' },
    BNI: { bg: 'bg-orange-500', text: 'BNI' },
    BRI: { bg: 'bg-blue-800', text: 'BRI' },
    Gojek: { bg: 'bg-green-500', text: 'Go' },
    OVO: { bg: 'bg-pink-500', text: 'OVO' },
    DANA: { bg: 'bg-blue-500', text: 'Dana' },
    Indomaret: { bg: 'bg-red-600', text: 'IND' },
    Alfamart: { bg: 'bg-red-700', text: 'ALF' },
    QRIS: { bg: 'bg-purple-500', text: 'QR' },
    'Visa/Mastercard': { bg: 'bg-blue-700', text: 'CC' },
  };

  const style = iconMap[provider] || { bg: 'bg-secondary-400', text: provider.slice(0, 3).toUpperCase() };

  return (
    <div className={cn('w-full h-full flex items-center justify-center text-white text-xs font-bold rounded', style.bg)}>
      {style.text}
    </div>
  );
}
```

---

## `frontend/src/store/cart.store.ts`

```tsx
'use client';

/**
 * Cart Store (Zustand)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Cart, CheckoutPreview, ShippingOption, AddItemPayload } from './cart.types';
import { API_BASE_URL } from '@/lib/constants';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  isDrawerOpen: boolean;
  checkoutInProgress: boolean;
  checkoutPreview: CheckoutPreview | null;
  selectedShipping: ShippingOption | null;
}

interface CartActions {
  addItem: (item: CartItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
  loadCart: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  setCheckoutInProgress: (value: boolean) => void;
  setError: (error: string | null) => void;
  setCheckoutPreview: (preview: CheckoutPreview | null) => void;
  setSelectedShipping: (shipping: ShippingOption | null) => void;
  _setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      isDrawerOpen: false,
      checkoutInProgress: false,
      checkoutPreview: null,
      selectedShipping: null,

      addItem: (item: CartItem) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex >= 0) {
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + item.quantity,
          };
          set({ items: updatedItems });
        } else {
          set({ items: [...items, item] });
        }
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const items = get().items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items });
      },

      removeItem: (itemId: string) => {
        const items = get().items.filter((item) => item.id !== itemId);
        set({ items });
      },

      clearCart: () => {
        set({ items: [], checkoutPreview: null, selectedShipping: null });
      },

      syncWithServer: async () => {
        set({ isSyncing: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn('Failed to sync cart with server, keeping local state');
            set({ isSyncing: false });
            return;
          }

          const data = await response.json();
          const serverItems = data.cart?.items || [];
          const localItems = get().items;

          if (serverItems.length > 0) {
            set({ items: serverItems });
          } else if (localItems.length === 0) {
            set({ items: [] });
          }
        } catch (error) {
          console.warn('Cart sync error:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      loadCart: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn('Failed to load cart from server, keeping local state');
            set({ isLoading: false });
            return;
          }

          const data = await response.json();
          const serverItems = data.cart?.items || [];
          const localItems = get().items;

          if (serverItems.length > 0) {
            set({ items: serverItems });
          } else if (localItems.length === 0) {
            set({ items: [] });
          }
        } catch (error) {
          console.warn('Cart load error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setCheckoutInProgress: (value: boolean) => set({ checkoutInProgress: value }),
      setError: (error: string | null) => set({ error }),
      setCheckoutPreview: (preview: CheckoutPreview | null) => set({ checkoutPreview: preview }),
      setSelectedShipping: (shipping: ShippingOption | null) => set({ selectedShipping: shipping }),
      _setItems: (items: CartItem[]) => set({ items }),
    }),
    {
      name: 'pasaria-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

export const useCartSubtotal = () => {
  const items = useCartStore((state) => state.items);
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const useCartItemCount = () => {
  const items = useCartStore((state) => state.items);
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useHasUnavailableItems = () => {
  const items = useCartStore((state) => state.items);
  return items.some((item) => !item.isAvailable || item.quantity > item.stock);
};

export const useHasPriceChanges = () => {
  const items = useCartStore((state) => state.items);
  return items.some((item) => item.price !== item.currentPrice);
};

export const useIsCheckoutDisabled = () => {
  const items = useCartStore((state) => state.items);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const checkoutInProgress = useCartStore((state) => state.checkoutInProgress);

  return (
    items.length === 0 ||
    items.every((item) => !item.isAvailable) ||
    items.some((item) => item.quantity > item.stock) ||
    items.some((item) => item.price !== item.currentPrice) ||
    isSyncing ||
    checkoutInProgress
  );
};
```

---

## `frontend/src/services/cart.service.ts`

```typescript
/**
 * Cart Service
 */

import type { Cart, CartItem, AddItemPayload, CheckoutPreview, ShippingOption, Address } from '@/store/cart.types';
import { API_BASE_URL } from '@/lib/constants';

interface CartApiResponse {
  success: boolean;
  cart?: Cart;
  message?: string;
}

interface CheckoutPreviewResponse {
  success: boolean;
  preview?: CheckoutPreview;
}

interface ShippingOptionsResponse {
  success: boolean;
  options?: ShippingOption[];
}

interface PaymentMethodResponse {
  id: string;
  name: string;
  type: string;
  provider: string;
  icon: string;
  description: string;
  fee: number;
  minAmount?: number;
  maxAmount?: number;
}

interface PaymentMethodsResponse {
  success: boolean;
  methods?: PaymentMethodResponse[];
}

interface AddressesResponse {
  success: boolean;
  addresses?: Address[];
}

class CartService {
  async getCart(): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('User not authenticated for cart');
        return { success: true, cart: undefined };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.getCart error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch cart',
      };
    }
  }

  async addItem(payload: AddItemPayload): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`CartService.addItem failed: ${response.status}`, errorText);
        return {
          success: false,
          message: `Failed to add item: ${response.status}`,
        };
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.addItem error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add item',
      };
    }
  }

  async updateQuantity(productId: string, quantity: number): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (response.status === 401) {
        console.warn('User not authenticated for cart update');
        return { success: true };
      }

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Item ${productId} not found in backend cart for update`);
          return { success: true };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.updateQuantity error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update quantity',
      };
    }
  }

  async removeItem(productId: string): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('User not authenticated for cart removal');
        return { success: true };
      }

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Item ${productId} not found in backend cart`);
          return { success: true };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.removeItem error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove item',
      };
    }
  }

  async clearCart(): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('User not authenticated for cart clear');
        return { success: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.clearCart error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear cart',
      };
    }
  }

  async initiateCheckout(): Promise<CheckoutPreviewResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('User not authenticated for checkout');
        return { success: false, preview: undefined };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        preview: data.data ? {
          items: data.data.items || [],
          subtotal: data.data.summary?.subtotal || 0,
          shipping: 0,
          total: data.data.summary?.subtotal || 0,
          validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        } : undefined,
      };
    } catch (error) {
      console.error('CartService.initiateCheckout error:', error);
      return { success: false };
    }
  }

  async completeCheckout(params?: {
    selectedShippingId?: string;
    selectedPaymentId?: string;
  }): Promise<{ success: boolean; orderId?: number; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/checkout/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedShippingId: params?.selectedShippingId,
          selectedPaymentId: params?.selectedPaymentId,
        }),
      });

      if (response.status === 401) {
        console.warn('User not authenticated for checkout complete');
        return { success: false, message: 'Silakan login terlebih dahulu' };
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Checkout failed:', errorData.error?.message || 'Cart is empty');
        return {
          success: false,
          message: errorData.error?.message || 'Keranjang kosong atau sudah diproses'
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Checkout failed:', errorData.error?.message || `HTTP error! status: ${response.status}`);
        return {
          success: false,
          message: errorData.error?.message || 'Gagal menyelesaikan checkout'
        };
      }

      const data = await response.json();
      return {
        success: true,
        orderId: data.data?.orderId,
      };
    } catch (error) {
      console.error('CartService.completeCheckout error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal menyelesaikan checkout',
      };
    }
  }

  async getShippingOptions(): Promise<ShippingOptionsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/shipping`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('User not authenticated for shipping options');
        return { success: false, options: [] };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        options: data.data || [],
      };
    } catch (error) {
      console.error('CartService.getShippingOptions error:', error);
      return { success: false, options: [] };
    }
  }

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('User not authenticated for payment methods');
        return { success: false, methods: [] };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        methods: data.data || [],
      };
    } catch (error) {
      console.error('CartService.getPaymentMethods error:', error);
      return { success: false, methods: [] };
    }
  }

  async getAddresses(): Promise<AddressesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('User not authenticated for addresses');
        return { success: false, addresses: [] };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        addresses: data.data || [],
      };
    } catch (error) {
      console.error('CartService.getAddresses error:', error);
      return { success: false, addresses: [] };
    }
  }

  async addAddress(address: {
    label?: string;
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    province?: string;
    postalCode?: string;
  }): Promise<{ success: boolean; address?: Address; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: data.success, address: data.data };
    } catch (error) {
      console.error('CartService.addAddress error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to add address' };
    }
  }

  async updateAddress(id: string, address: Partial<{
    label: string;
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
  }>): Promise<{ success: boolean; address?: Address; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: data.success, address: data.data };
    } catch (error) {
      console.error('CartService.updateAddress error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to update address' };
    }
  }

  async deleteAddress(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('CartService.deleteAddress error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to delete address' };
    }
  }

  async setDefaultAddress(id: string): Promise<{ success: boolean; address?: Address; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${id}/default`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: data.success, address: data.data };
    } catch (error) {
      console.error('CartService.setDefaultAddress error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to set default address' };
    }
  }
}

export const cartService = new CartService();
export { CartService };
```

---

## `frontend/src/components/features/orders/order-detail.tsx`

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Truck, CreditCard, Package,
  Check, Clock, RotateCcw, X, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { Order } from '@/types/api';

interface OrderDetailProps {
  readonly order: Order;
  readonly onReturnItem?: (orderId: number, itemId: string) => void;
}

export function OrderDetail({ order, onReturnItem }: Readonly<OrderDetailProps>) {
  const [returningItems, setReturningItems] = useState<Set<string>>(new Set());
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);

  const handleReturnToggle = (itemId: string) => {
    setReturningItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleConfirmReturn = () => {
    if (showReturnConfirm) {
      returningItems.forEach((itemId) => {
        onReturnItem?.(order.id, itemId);
      });
      setReturningItems(new Set());
      setShowReturnConfirm(false);
    } else {
      setShowReturnConfirm(true);
    }
  };

  const canReturn = order.status === 'COMPLETED' || order.status === 'DELIVERED';

  const getStatusBannerClass = (status: string): string => {
    if (status === 'COMPLETED') return 'bg-green-500 text-white';
    if (status === 'CANCELLED') return 'bg-red-500 text-white';
    if (status === 'DRAFT') return 'bg-secondary-400 text-white';
    return 'bg-primary-500 text-white';
  };

  return (
    <div className="space-y-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Pesanan</span>
      </Link>

      <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className={cn(
          'px-6 py-4 flex items-center justify-between',
          getStatusBannerClass(order.status)
        )}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <StatusIcon status={order.status} />
            </div>
            <div>
              <p className="font-semibold text-lg">{getStatusLabel(order.status)}</p>
              <p className="text-sm opacity-80">Pesanan #{order.id}</p>
            </div>
          </div>
          <p className="text-sm opacity-80">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <OrderTimeline status={order.status} />
      </div>

      <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-secondary-100">
          <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-secondary-400" />
            Item Pesanan ({order.items.length})
          </h2>
        </div>

        <div className="divide-y divide-secondary-100">
          {order.items.map((item, index) => (
            <div key={item.id || `item-${index}`} className="p-6 flex gap-4 hover:bg-secondary-50/50 transition-colors">
              <div className="w-24 h-24 rounded-xl bg-secondary-100 overflow-hidden relative flex-shrink-0">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-400 text-2xl font-bold">
                    {item.productName.charAt(0)}
                  </div>
                )}
                {canReturn && returningItems.has(item.id ? String(item.id) : `item-${index}`) && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-secondary-900 mb-1">
                  {item.productName}
                </h3>
                <p className="text-sm text-secondary-500">
                  {item.quantity}x @ {formatCurrency(item.snapshotPrice ?? item.unitPrice)}
                </p>
                {item.productImage && (
                  <p className="text-xs text-secondary-400 mt-1 truncate">
                    Image: {item.productImage.substring(0, 40)}...
                  </p>
                )}
              </div>

              {canReturn && (
                <button
                  onClick={() => handleReturnToggle(item.id ? String(item.id) : `item-${index}`)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all self-center',
                    returningItems.has(item.id ? String(item.id) : `item-${index}`)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-secondary-300 hover:border-secondary-400'
                  )}
                >
                  {returningItems.has(item.id ? String(item.id) : `item-${index}`) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-secondary-400" />
                  )}
                </button>
              )}

              <div className="text-right flex-shrink-0 self-center">
                <p className="font-semibold text-secondary-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {canReturn && returningItems.size > 0 && (
          <div className="p-6 bg-amber-50 border-t border-amber-200">
            {showReturnConfirm ? (
              <div className="flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="flex-1 text-sm text-amber-800">
                  Yakin ingin mengembalikan {returningItems.size} item?
                </p>
                <button
                  onClick={() => {
                    setShowReturnConfirm(false);
                    setReturningItems(new Set());
                  }}
                  className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Konfirmasi
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-800">
                  {returningItems.size} item dipilih untuk dikembalikan
                </p>
                <button
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ajukan Pengembalian
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(order.shippingName || order.shippingAddress) && (
          <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-secondary-100">
              <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-secondary-400" />
                Informasi Pengiriman
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {order.shippingName && (
                  <div>
                    <p className="text-sm text-secondary-500">Penerima</p>
                    <p className="font-medium text-secondary-900">{order.shippingName}</p>
                  </div>
                )}
                {order.shippingPhone && (
                  <div>
                    <p className="text-sm text-secondary-500">Telepon</p>
                    <p className="font-medium text-secondary-900">{order.shippingPhone}</p>
                  </div>
                )}
                {order.shippingAddress && (
                  <div>
                    <p className="text-sm text-secondary-500">Alamat</p>
                    <p className="font-medium text-secondary-900">
                      {order.shippingAddress}
                      {order.shippingCity && `, ${order.shippingCity}`}
                      {order.shippingPostalCode && ` ${order.shippingPostalCode}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-secondary-100">
            <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-secondary-400" />
              Ringkasan Pembayaran
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Subtotal</span>
                <span className="font-medium text-secondary-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Ongkos Kirim</span>
                <span className="font-medium text-secondary-900">
                  {order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Gratis'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Biaya Admin</span>
                <span className="font-medium text-secondary-900">
                  {order.adminFee > 0 ? formatCurrency(order.adminFee) : '-'}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-secondary-100">
                <span className="font-semibold text-secondary-900">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {order.payment && (
              <div className="mt-6 pt-4 border-t border-secondary-100">
                <p className="text-sm text-secondary-500 mb-2">Metode Pembayaran</p>
                <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">{order.payment.method}</p>
                    <p className="text-xs text-secondary-500 capitalize">{order.payment.status.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ status }: Readonly<{ status: string }>) {
  const steps = [
    { key: 'DRAFT', label: 'Draft', icon: Package },
    { key: 'WAITING_PAYMENT', label: 'Menunggu Bayar', icon: Clock },
    { key: 'PAID', label: 'Dibayar', icon: Check },
    { key: 'PROCESSING', label: 'Diproses', icon: Package },
    { key: 'SHIPPING', label: 'Dikirim', icon: Truck },
    { key: 'DELIVERED', label: 'Tiba', icon: Package },
    { key: 'COMPLETED', label: 'Selesai', icon: Check },
  ];

  const currentIndex = steps.findIndex(s => s.key === status);
  const isCancelled = status === 'CANCELLED' || status === 'EXPIRED';

  const getStepIconClass = (isCancelledStep: boolean, isPast: boolean, isCurrent: boolean): string => {
    if (isCancelledStep) return 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors bg-red-100 text-red-500';
    if (isPast || isCurrent) return 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors bg-primary-500 text-white';
    return 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors bg-secondary-200 text-secondary-400';
  };

  const getStepLabelClass = (isCancelledStep: boolean, isPast: boolean, isCurrent: boolean): string => {
    if (isCancelledStep) return 'text-xs mt-1 whitespace-nowrap text-red-500';
    if (isPast || isCurrent) return 'text-xs mt-1 whitespace-nowrap text-secondary-900 font-medium';
    return 'text-xs mt-1 whitespace-nowrap text-secondary-400';
  };

  return (
    <div className="px-6 py-4 bg-secondary-50/50">
      <div className="flex items-center justify-between overflow-x-auto">
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isCancelledStep = isCancelled && !isPast;

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={getStepIconClass(isCancelledStep, isPast, isCurrent)}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className={getStepLabelClass(isCancelledStep, isPast, isCurrent)}>
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className={cn(
                  'w-8 md:w-12 h-0.5 mx-1',
                  index < currentIndex ? 'bg-primary-500' : 'bg-secondary-200'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700 font-medium">
            Pesanan ini telah {status === 'CANCELLED' ? 'dibatalkan' : 'kedaluwarsa'}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: Readonly<{ status: string }>) {
  switch (status) {
    case 'COMPLETED':
      return <Check className="w-6 h-6" />;
    case 'CANCELLED':
    case 'EXPIRED':
      return <X className="w-6 h-6" />;
    case 'SHIPPING':
      return <Truck className="w-6 h-6" />;
    case 'WAITING_PAYMENT':
    case 'PENDING':
      return <Clock className="w-6 h-6" />;
    default:
      return <Package className="w-6 h-6" />;
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Pesanan Draft',
    WAITING_PAYMENT: 'Menunggu Pembayaran',
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Sudah Dibayar',
    PROCESSING: 'Sedang Diproses',
    SHIPPING: 'Sedang Dikirim',
    DELIVERED: 'Pesanan Tiba',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    EXPIRED: 'Kedaluwarsa',
  };
  return labels[status] || status;
}
```

---

## `frontend/src/services/order.service.ts`

```typescript
/**
 * Order Service
 */

import apiClient from './api-client';
import type { Order, OrderStatus } from '@/types/api/order.types';

interface CreateOrderResponse {
  success: boolean;
  data?: {
    orderId: number;
    status: OrderStatus;
    totalQuantity: number;
    totalItemCount: number;
    subtotal: number;
    shippingFee: number;
    adminFee: number;
    total: number;
    items: Order['items'];
    createdAt: string;
  };
  error?: { code: string; message: string };
}

interface OrdersListResponse {
  success: boolean;
  data?: {
    items: Order[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  };
  error?: { code: string; message: string };
}

interface OrderResponse {
  success: boolean;
  data?: { order: Order };
  error?: { code: string; message: string };
}

export const orderService = {
  async createDraft(): Promise<Order> {
    const response = await apiClient.post<CreateOrderResponse>('/orders/draft', {});
    const { success, data, error } = response.data;

    if (!success || !data) {
      throw new Error(error?.message || 'Failed to create order');
    }

    return {
      id: data.orderId,
      userId: 0,
      status: data.status,
      items: data.items,
      subtotal: data.subtotal,
      shippingFee: data.shippingFee,
      adminFee: data.adminFee,
      total: data.total,
      totalQuantity: data.totalQuantity,
      totalItemCount: data.totalItemCount,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    };
  },

  async getOrders(options?: {
    page?: number;
    limit?: number;
    status?: OrderStatus | OrderStatus[];
  }): Promise<{
    items: Order[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.status) {
      const statusValue = Array.isArray(options.status) ? options.status.join(',') : options.status;
      params.set('status', statusValue);
    }

    const queryString = params.toString();
    const url = queryString ? `/orders?${queryString}` : '/orders';

    const response = await apiClient.get<OrdersListResponse>(url);
    const { success, data, error } = response.data;

    if (!success || !data) {
      throw new Error(error?.message || 'Failed to fetch orders');
    }

    return { items: data.items, pagination: data.pagination };
  },

  async getOrderById(orderId: number): Promise<Order> {
    const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
    const { success, data, error } = response.data;

    if (!success || !data?.order) {
      throw new Error(error?.message || 'Failed to fetch order');
    }

    return data.order;
  },

  async updateOrderStatus(orderId: number, newStatus: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<{ success: boolean; data?: { order: Order }; error?: { code: string; message: string } }>(
      `/orders/${orderId}/status`,
      { status: newStatus }
    );
    const { success, data, error } = response.data;

    if (!success || !data?.order) {
      throw new Error(error?.message || 'Failed to update order status');
    }

    return data.order;
  },

  async cancelOrder(orderId: number, reason?: string): Promise<Order> {
    const response = await apiClient.post<{ success: boolean; data?: { order: Order }; error?: { code: string; message: string } }>(
      `/orders/${orderId}/cancel`,
      { reason }
    );
    const { success, data, error } = response.data;

    if (!success || !data?.order) {
      throw new Error(error?.message || 'Failed to cancel order');
    }

    return data.order;
  },
} as const;

export enum OrderError {
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
}

export const ORDER_ERROR_MESSAGES: Record<OrderError, string> = {
  [OrderError.NETWORK]: 'Koneksi terputus. Periksa internet Anda.',
  [OrderError.NOT_FOUND]: 'Pesanan tidak ditemukan.',
  [OrderError.UNAUTHORIZED]: 'Anda tidak memiliki akses ke pesanan ini.',
  [OrderError.UNKNOWN]: 'Terjadi kesalahan. Silakan coba lagi.',
};

export function handleOrderError(error: unknown): OrderError {
  if (error instanceof Error) {
    if (error.message.includes('404')) return OrderError.NOT_FOUND;
    if (error.message.includes('401')) return OrderError.UNAUTHORIZED;
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return OrderError.NETWORK;
    }
  }
  return OrderError.UNKNOWN;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAID: 'Sudah Dibayar',
  PROCESSING: 'Sedang Diproses',
  SHIPPING: 'Sedang Dikirim',
  DELIVERED: 'Telah Tiba',
  COMPLETED: 'Selesai',
  EXPIRED: 'Kadaluarsa',
  CANCELLED: 'Dibatalkan',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  WAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPING: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'DRAFT', 'WAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPING', 'DELIVERED',
];

export const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  'COMPLETED', 'EXPIRED', 'CANCELLED',
];
```

---

## `frontend/src/types/api/order.types.ts`

```typescript
// Order Types

export type OrderStatus =
  | 'DRAFT'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  snapshotPrice?: number;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface PaymentInfo {
  id: number;
  status: PaymentStatus;
  method: string;
  amount: number;
  paidAt: string | null;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  adminFee: number;
  total: number;
  totalQuantity: number;
  totalItemCount: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  createdAt: string;
  updatedAt: string;
  payment?: PaymentInfo;
}
```

---

## `frontend/src/components/features/cart/checkout-preview/index.ts`

```typescript
export { CheckoutPreview } from './checkout-preview';
```

---

## `frontend/src/store/cart.types.ts`

```typescript
/**
 * Cart Store Types
 */

export interface CartItemVariantInfo {
  color?: string;
  size?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  quantity: number;
  image: string;
  stock: number;
  isAvailable: boolean;
  variantInfo?: CartItemVariantInfo;
}

export interface Cart {
  id: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddItemPayload {
  productId: number;
  variantId?: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  cart: Cart;
  message?: string;
}

export interface StockValidation {
  itemId: string;
  available: number;
  requested: number;
  isValid: boolean;
}

export interface CheckoutPreview {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  validUntil: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description?: string;
  logo?: string;
}

export type PaymentMethodType = 'bank_transfer' | 'ewallet' | 'credit_card' | 'convenience_store' | 'qr_code';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  provider: string;
  icon: string;
  description?: string;
  fee: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postalCode: string;
  isDefault: boolean;
}
```

---

## `frontend/src/types/api/checkout.types.ts`

```typescript
// Checkout Types

export interface CheckoutItemPreview {
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  snapshotPrice: number;
  subtotal: number;
}

export interface CheckoutSummary {
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  totalQuantity: number;
}

export interface CheckoutPreview {
  items: CheckoutItemPreview[];
  summary: CheckoutSummary;
}

export interface InitiateCheckoutResponse {
  orderId: number;
  orderStatus: 'DRAFT';
  expiresAt: string;
}
```

---

## `frontend/src/lib/constants.ts`

```typescript
// App Constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000;

export const APP_NAME = 'Pasaria';
export const APP_DESCRIPTION = 'Pasar Indonesia Online';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const CART_TTL_DAYS = 7;
export const MAX_CART_ITEMS = 50;

export const TOAST_DURATION = 4000;
export const MAX_TOASTS = 3;

export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000;

export const SEARCH_DEBOUNCE_MS = 300;
export const FILTER_DEBOUNCE_MS = 300;
export const QUANTITY_DEBOUNCE_MS = 500;
```
