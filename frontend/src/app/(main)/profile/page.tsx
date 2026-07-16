'use client';

/**
 * Profile Page
 * Route: /profile
 * Manage user addresses
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cartService } from '@/services/cart.service';
import { useAuthStore } from '@/store/auth.store';
import { MapPin, Plus, Edit2, Trash2, Check, User, Package } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Address } from '@/store/cart.types';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    label: 'Rumah',
    recipientName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  // Load addresses
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await cartService.getAddresses();
      if (response.success && response.addresses) {
        setAddresses(response.addresses);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await cartService.addAddress(formData);
      if (response.success && response.address) {
        setAddresses([...addresses, response.address]);
        setShowAddForm(false);
        resetForm();
      } else {
        setError(response.message || 'Gagal menyimpan alamat');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus alamat ini?')) return;

    try {
      const response = await cartService.deleteAddress(id);
      if (response.success) {
        setAddresses(addresses.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await cartService.setDefaultAddress(id);
      if (response.success) {
        setAddresses(
          addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      label: 'Rumah',
      recipientName: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
  };

  return (
    <div className="bg-secondary-50 min-h-screen">
      <Container>
        {/* Header */}
        <div className="py-6">
          <h1 className="text-2xl font-bold text-secondary-900">Profil</h1>
          <p className="text-secondary-600 mt-1">Kelola informasi akun dan alamat pengiriman</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-secondary-200 p-6 sticky top-24">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-secondary-100">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-secondary-900">{user?.email}</p>
                  <p className="text-sm text-secondary-500 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>

              {/* Menu */}
              <div className="space-y-2">
                <MenuItem href="/profile" icon={<User className="w-4 h-4" />} active>
                  Informasi Akun
                </MenuItem>
                <MenuItem href="/profile#addresses" icon={<MapPin className="w-4 h-4" />}>
                  Alamat Pengiriman
                </MenuItem>
                <MenuItem href="/orders" icon={<Package className="w-4 h-4" />}>
                  Pesanan Saya
                </MenuItem>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Addresses Section */}
            <div id="addresses" className="bg-white rounded-xl border border-secondary-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-secondary-900">Alamat Pengiriman</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Alamat
                </Button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Add Form */}
              {showAddForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-secondary-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="Rumah, Kantor, dll"
                    />
                    <Input
                      label="Nama Penerima *"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    label="Nomor Telepon *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                  <Input
                    label="Alamat Lengkap *"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Kota *"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                    <Input
                      label="Provinsi"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    />
                    <Input
                      label="Kode Pos"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit">Simpan</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
                      Batal
                    </Button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {isLoading ? (
                <div className="text-center py-8 text-secondary-500">Memuat...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-secondary-300 mb-3" />
                  <p className="text-secondary-500">Belum ada alamat</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="mt-4"
                  >
                    Tambah Alamat Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={cn(
                        'p-4 rounded-lg border transition-colors',
                        address.isDefault
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-secondary-300'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-secondary-900">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                                Utama
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary-600">{address.recipientName}</p>
                          <p className="text-sm text-secondary-500">{address.phone}</p>
                          <p className="text-sm text-secondary-500 mt-1">
                            {address.address}, {address.city} {address.postalCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefault(address.id)}
                              className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                              title="Jadikan utama"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(address.id)}
                            className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function MenuItem({
  href,
  icon,
  active,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        active
          ? 'bg-primary-50 text-primary-600 font-medium'
          : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
