# Rancangan Implementasi Seller Dashboard (MVP) - Pasaria E-Commerce

Dokumen ini berisi rancangan arsitektur dan fitur untuk Dashboard Penjual (Seller Centre) di project Pasaria, yang diadaptasi dan disederhanakan dari ekosistem marketplace besar (seperti Shopee) agar sesuai dengan struktur database dan UI frontend Pasaria saat ini.

## 1. Tujuan & Ruang Lingkup (MVP)
Fokus utama dari MVP ini adalah memberikan kemampuan dasar bagi user dengan role `SELLER` untuk mengelola inventori mereka dan memproses pesanan yang masuk. 

Berdasarkan kapabilitas database saat ini (Prisma schema), kita akan **mengeliminasi** fitur kompleks seperti Live, Ads, Affiliate, Campaign, dan Chat, lalu fokus pada **inti operasional toko**.

### Fitur yang Masuk MVP (Fase 1)
1. Dashboard Ringkasan
2. Manajemen Produk & Stok
3. Manajemen Pesanan
4. Pengaturan Profil Toko (Sederhana)

### Fitur yang Ditunda (Fase 2 - Butuh Tambahan Skema DB)
- Keuangan & Saldo (Dompet Penjual / Withdrawal)
- Manajemen Pengiriman Lanjutan (Integrasi Resi Otomatis / Ekspedisi)
- Chat Pelanggan
- Promo, Diskon Coret, dan Voucher
- Analitik Mendalam (Page views, conversion rate)

---

## 2. Struktur Menu & UI Seller Dashboard

Di sisi Frontend (misalnya di rute `/seller`), kita akan membuat layout khusus dengan sidebar berikut:

### 🏠 Dashboard
Halaman ringkasan operasional toko hari ini:
- Jumlah pesanan baru (Perlu Diproses)
- Jumlah pesanan sedang dikirim
- Produk dengan stok habis / menipis
- Total pendapatan kotor (Status Pesanan: Selesai)

### 📦 Manajemen Produk
Mengelola katalog yang dijual oleh seller tersebut.
- **Daftar Produk**: Tabel berisi produk seller (Filter: Aktif, Habis).
- **Tambah/Edit Produk**: 
  - Nama & Deskripsi
  - Harga (`price`)
  - Stok (`availableStock`)
  - Kategori (`categoryId`)
  - Foto Produk (Maks 5 foto, 1 utama)
- **Hapus Produk**: Soft delete atau hapus dari database.

### 🛒 Manajemen Pesanan
Seller hanya melihat item pesanan yang memuat produk miliknya.
- **Perlu Diproses**: Pesanan masuk yang sudah dibayar (Status: `PAID`). Seller bisa klik "Proses Pesanan" (Ubah status ke `PROCESSING`).
- **Sedang Dikirim**: Seller memasukkan nomor resi (manual) dan mengubah status ke `SHIPPING`.
- **Selesai**: Pesanan yang sudah diterima pembeli (`DELIVERED` / `COMPLETED`).
- **Dibatalkan**: Pesanan yang di-cancel.

### ⚙️ Pengaturan Toko
- **Profil Toko**: Nama toko, deskripsi singkat (Saat ini menempel di model `User`, mungkin ke depan perlu tabel `Store` terpisah).
- **Alamat Toko**: Alamat pengiriman asal barang (Menggunakan tabel `Address` dengan label khusus).

---

## 3. Penyesuaian Arsitektur & Database

Berdasarkan `schema.prisma` saat ini, pondasi sudah cukup kuat. Namun, ada beberapa penyesuaian/asumsi yang perlu dilakukan:

### A. Autentikasi & Otorisasi
- **Middleware Role**: Pastikan route API untuk manajemen produk seller memvalidasi bahwa `req.user.role === 'SELLER'`.
- **Data Isolation**: Saat seller melakukan `GET /api/products` di dashboardnya, API harus mengembalikan *hanya* produk di mana `product.sellerId === req.user.id`. Sama halnya dengan pesanan.

### B. Perbaikan Relasi Pesanan (Order)
Saat ini `Order` terikat pada `userId` (Pembeli), namun di dalam `Order` bisa berisi `OrderItem` dari berbagai Seller berbeda (Cart campuran). 
**Tantangan**: Jika pembeli checkout barang dari Seller A dan Seller B sekaligus, 1 Order ID memuat barang 2 Seller.
**Solusi MVP**: 
1. Di halaman Seller, query data `OrderItem` yang `productId`-nya milik si Seller.
2. Seller mengubah status pengiriman per *Item*, bukan per *Global Order* (atau, saat checkout, keranjang dipecah per-seller menjadi `Order` terpisah). *Disarankan memecah Order per Seller saat checkout untuk memudahkan manajemen status*.

### C. Tabel Tambahan (Rekomendasi untuk Next Step)
Agar lebih mirip Shopee, profil toko idealnya tidak dicampur di tabel `User`.
```prisma
// Rekomendasi tambahan skema
model Store {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique
  user        User     @relation(fields: [userId], references: [id])
  name        String   @unique
  description String?
  logoUrl     String?
  isActive    Boolean  @default(true)
  
  // Relasi
  // Product harusnya relasi ke StoreId bukan UserId
}
```
*Namun untuk MVP saat ini, menggunakan `sellerId` (merujuk ke `User.id`) pada `Product` sudah cukup fungsional.*

---

## 4. Rencana Implementasi API (Backend)

Beberapa rute API baru (atau yang disesuaikan) di sisi Express:

**Auth & Onboarding**
- `POST /api/auth/register-seller` -> Mendaftar dengan role `SELLER`.

**Seller Dashboard - Analytics**
- `GET /api/seller/dashboard/summary` -> Mengambil agregat order, pendapatan, dan stok menipis khusus `sellerId`.

**Seller Dashboard - Products**
- `GET /api/seller/products` -> Ambil produk khusus milik `req.user.id`.
- `POST /api/seller/products` -> Tambah produk (otomatis set `sellerId = req.user.id`).
- `PUT /api/seller/products/:id` -> Update produk (Validasi kepemilikan!).

**Seller Dashboard - Orders**
- `GET /api/seller/orders` -> Ambil OrderItem / Order yang relevan dengan produk milik seller.
- `PATCH /api/seller/orders/:id/status` -> Update status pengiriman pesanan (misal: set nomor resi).

---

## 5. Kesimpulan Langkah Selanjutnya

1. **Backend**: Buat route group baru (misal `/api/seller/*`) dengan middleware otorisasi khusus `SELLER`.
2. **Backend**: Sesuaikan atau buat controller untuk manajemen produk dan pesanan yang terisolasi berdasarkan kepemilikan (`sellerId`).
3. **Frontend**: Buat layout baru di `src/app/seller/` (Mirip dengan `src/app/admin/` yang sudah ada, tapi fiturnya disesuaikan untuk penjual tunggal).
4. **Database (Opsional/Nanti)**: Refactor `Order` menjadi per-toko jika cart mendukung multi-toko, agar status pesanan (Dikemas, Dikirim) tidak bentrok antar seller.
