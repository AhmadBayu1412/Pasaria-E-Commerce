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
                  {/* Group by type */}
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
                  {/* Address Summary */}
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

                  {/* Shipping Summary */}
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

                  {/* Payment Summary */}
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

                  {/* Items Preview */}
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

                  {/* Security Notice */}
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

            {/* Error */}
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

              {/* Items */}
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

              {/* Summary */}
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

/**
 * Payment Icon Component
 */
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
