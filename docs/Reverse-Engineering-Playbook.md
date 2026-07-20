# Reverse Engineering Playbook
## Blueprint Dokumentasi untuk Membangun Aplikasi Kelas Dunia

---

## Pendahuluan

### Tujuan Dokumen

Playbook ini adalah **panduan sistematis** untuk melakukan reverse engineering terhadap aplikasi-aplikasi besar. Bukan sekadar teori, melainkan kumpulan template, checklist, dan format yang bisa langsung digunakan untuk mengaudit setiap halaman aplikasi target.

### Mindset yang Harus Dimiliki

Sebelum mulai, pahami satu hal fundamental:

> **Reverse engineering bukan mencuri. Reverse engineering adalah belajar.**

Ketika kita reverse engineer Shopee, kita tidak menyalin kode mereka. Kita **mempelajari keputusan desain** yang mereka buat untuk menyelesaikan masalah yang sama dengan yang kita hadapi. Keputusan mana yang masuk akal untuk konteks kita? Keputusan mana yang tidak? Keputusan mana yang bisa kita adaptasi?

Ini namanya **arsitektur observasional** — memahami mengapa sebuah sistem dirancang seperti itu, bukan sekadar tahu bahwa sistem itu ada.

### Prinsip-Prinsip Utama

```
1. OBSERVASI → TIDAK SAMA DENGAN PENIRUAN

   Melihat bahwa Shopee punya fitur flash sale tidak berarti
   kita harus membuat flash sale dengan cara yang sama.
   
   Mungkin kita belajar: "User tertarik dengan timer
   countdown" → solusi kita mungkinbeda: "stok real-time"

2. KONTEKS SANGAT PENTING

   Fitur yang bekerja di Shopee mungkin tidak cocok untuk
   kita karena:
   - Basis pengguna berbeda
   - Skala berbeda
   - Model bisnis berbeda
   - Sumber daya berbeda

3. INTERAKSI > TEORI

   Jangan hanya membaca tentang aplikasi. JADIKAN PENGGUNA.
   Buka aplikasi. Gunakan. Amati. Rasakan.

4. DOKUMENTASI MENTAL ≠ DOKUMENTASI NYATA

   "Saya mengerti cara kerja fitur itu" tidak cukup.
   Tulislah. Gambarlah. Buat tabelnya.
   Pengetahuan yang tidak tertulis akan hilang.

5. DELAPAN LAYER ADALAH SATU SISTEM

   Layer-layer ini tidak berdiri sendiri. UI mempengaruhi
   UX. UX membentuk Business Flow. Business Flow menentukan
   API. API membutuhkan Database. Database merefleksikan
   Architecture.
```

---

## Bagian 1: Kerangka Kerja Delapan Layer

Setiap layer memiliki:
- **Definisi** — apa yang diamati
- **Pertanyaan kunci** — apa yang harus dijawab
- **Format dokumentasi** — bagaimana mencatat hasil
- **Contoh konkret** — Shopee sebagai studi kasus

---

### Layer 1: Visual UI Audit

#### Definisi

Layer ini mengidentifikasi **semua komponen visual** yang muncul di halaman. Tidak melihat warna, font, atau estetika. Melihat **struktur dan fungsi** dari setiap elemen UI.

#### Mengapa Layer Ini Penting

```
UI adalah kontrak antara sistem dan pengguna.
Setiap komponen yang ditampilkan adalah keputusan:
- Komponen apa yang harus ada?
- Komponen apa yang harus diutamakan?
- Komponen apa yang harus disembunyikan?

Dengan memahami komponen, kita memahami PRIORITAS bisnis.
```

#### Pertanyaan Kunci

```
1. Apa saja komponen yang terlihat di halaman ini?
2. Bagaimana komponen-komponen itu diatur? (hierarki visual)
3. Apa yang paling menonjol? (visual hierarchy)
4. Komponen mana yang selalu terlihat vs tersembunyi?
5. Komponen mana yang dinamis vs statis?
6. Apakah ada komponen yang konteks-spesifik?
```

#### Format Dokumentasi: UI Component Checklist

Buat tabel untuk setiap halaman:

```
┌─────────────────────────────────────────────────────────────────────┐
│ HALAMAN: [Nama Halaman]                                             │
│ TANGGAL AUDIT: [Tanggal]                                           │
│ AUDITOR: [Nama]                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ NO  │ KOMPONEN           │ PRIORITAS │ STATUS     │ CATATAN       │
├─────┼────────────────────┼───────────┼────────────┼───────────────┤
│ 1   │ [Nama komponen]    │ [1-5]     │ □ Ada      │ [Observasi]   │
│     │                    │           │ □ Tidak    │               │
├─────┼────────────────────┼───────────┼────────────┼───────────────┤
│ ... │ ...                │ ...       │ ...        │ ...           │
└─────────────────────────────────────────────────────────────────────┘

PRIORITAS:
1 = Wajib ada, sangat kritis
2 = Sangat penting
3 = Penting
4 = Nice to have
5 = Tidak kritis

STATUS:
□ Ada = Komponen sudah terlihat/dapat diakses
□ Tidak = Komponen tidak ada di halaman ini
□ Kontek = Ada tapi hanya dalam kondisi tertentu
```

#### Studi Kasus: Halaman Produk Shopee

```
┌─────────────────────────────────────────────────────────────────────┐
│ HALAMAN: Product Detail Page (PDP)                                 │
│ TARGET: Shopee                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ NO  │ KOMPONEN                   │ PRIORITAS │ STATUS │ CATATAN   │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 1   │ Product Image Gallery      │ 1         │ □ Ada  │ Swipe,    │
│     │                            │           │        │ zoom      │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 2   │ Video Thumbnail             │ 2         │ □ Ada  │ Autoplay  │
│     │                            │           │        │ optional  │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 3   │ Price Display              │ 1         │ □ Ada  │ Diskon     │
│     │                            │           │        │ terlihat  │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 4   │ Discount Badge             │ 1         │ □ Ada  │ Persentase │
│     │                            │           │        │ besar     │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 5   │ Flash Sale Timer           │ 2         │ □ Ada  │ Countdown  │
│     │                            │           │        │ prominent │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 6   │ Voucher Banner             │ 2         │ □ Ada  │ Klik untuk │
│     │                            │           │        │ detail    │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 7   │ Variant Selector           │ 1         │ □ Ada  │ Warna,    │
│     │                            │           │        │ ukuran    │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 8   │ Stock Indicator            │ 1         │ □ Ada  │ "Tersisa   │
│     │                            │           │        │ X item"   │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 9   │ Quantity Selector          │ 1         │ □ Ada  │ Min 1,    │
│     │                            │           │        │ max sesuai│
│     │                            │           │        │ stok      │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 10  │ Add to Cart Button         │ 1         │ □ Ada  │ Sticky    │
│     │                            │           │        │ di mobile │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 11  │ Buy Now Button             │ 1         │ □ Ada  │ Warna      │
│     │                            │           │        │ kontras   │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 12  │ Wishlist/Bookmark          │ 2         │ □ Ada  │ Ikon hati  │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 13  │ Share Button               │ 3         │ □ Ada  │ WA, FB,   │
│     │                            │           │        │ link      │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 14  │ Seller Info Card           │ 2         │ □ Ada  │ Avatar,   │
│     │                            │           │        │ nama,     │
│     │                            │           │        │ rating    │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 15  │ Chat Seller Button         │ 2         │ □ Ada  │ Chat icon │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 16  │ Location/Ship From         │ 2         │ □ Ada  │ Kotaasal  │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 17  │ Shipping Options           │ 2         │ □ Ada  │ Reg, eks, │
│     │                            │           │        │ hrg vary  │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 18  │ Product Description Tab     │ 1         │ □ Ada  │ Tab aktif │
│     │                            │           │        │ default   │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 19  │ Specification Tab          │ 2         │ □ Ada  │ Info produk│
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 20  │ Reviews Tab                │ 1         │ □ Ada  │ Rating,   │
│     │                            │           │        │ filter    │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 21  │ Q&A Tab                   │ 3         │ □ Ada  │ Tanya jawab│
│     │                            │           │        │ produk    │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 22  │ Rating Summary             │ 1         │ □ Ada  │ Bintang,  │
│     │                            │           │        │ chart     │
├─────┼────────────────────────────┼───────────┼────────┼───────────┤
│ 23  │ Recommendation Section     │ 2         │ □ Ada  │ "Produk   │
│     │                            │           │        │ serupa"   │
└─────────────────────────────────────────────────────────────────────┘

TOTAL KOMPONEN: 23
PRIORITAS 1 (Wajib): 12 komponen
PRIORITAS 2 (Penting): 8 komponen
PRIORITAS 3 (Nice to have): 3 komponen
```

#### Latihan: Buat UI Component Checklist Anda

Untuk setiap halaman yang Anda audit, gunakan template ini:

```
┌─────────────────────────────────────────────────────────────────────┐
│ HALAMAN: [Nama Halaman]                                             │
│ TARGET: [Nama Aplikasi yang Diaudit]                               │
│ TANGGAL: [Tanggal Audit]                                           │
├─────────────────────────────────────────────────────────────────────┤
│ NO  │ KOMPONEN │ PRIORITAS │ STATUS │ CATATAN │
├─────┼──────────┼───────────┼────────┼─────────┤
│ 1   │          │           │ □      │         │
├─────┼──────────┼───────────┼────────┼─────────┤
│ 2   │          │           │ □      │         │
├─────┼──────────┼───────────┼────────┼─────────┤
│ 3   │          │           │ □      │         │
├─────┼──────────┼───────────┼────────┼─────────┤
│ ... │          │           │ □      │         │
└─────────────────────────────────────────────────────────────────────┘

ISI KOMPONEN DARI BAWAH KE ATAS:
□ Header/Navigation
□ Main Content Area
□ Footer
□ Modals/Overlays
□ Toast/Notification
□ Loading States
□ Error States
□ Empty States
□ Contextual Actions

EKSTRA:
□ Infinite scroll vs pagination
□ Lazy loading
□ Sticky elements
□ Floating buttons
□ Pull to refresh (mobile)
□ Swipe gestures
```

---

### Layer 2: UX Audit

#### Definisi

Layer ini menganalisis **bagaimana pengguna berinteraksi** dengan halaman. Tidak melihat apa yang ada, tapi melihat **bagaimana pengguna mencapainya**. Fokus pada alur, keputusan, dan perasaan pengguna.

#### Mengapa Layer Ini Penting

```
UI menjawab: "Apa yang ada di halaman?"
UX menjawab: "Bagaimana pengguna merasakan halaman itu?"

Aplikasi bisa punya komponen yang lengkap tapi
tetap terasa buruk karena UX yang buruk.

Sebaliknya, aplikasi dengan komponen sederhana
bisa terasa luar biasa dengan UX yang tepat.
```

#### Pertanyaan Kunci

```
1. Apa hal PERTAMA yang dilihat pengguna saat halaman load?
2. Di mana perhatian pengguna tertuju setelah itu?
3. Berapa banyak Klik/screen yang dibutuhkan untuk:
   - Menemukan produk?
   - Menambahkan ke keranjang?
   - Menyelesaikan pembelian?
4. Di mana titik-titik frustration?
5. Di mana titik-titik delight?
6. Bagaimana error handling?
7. Bagaimana empty states?
8. Bagaimana loading states?
```

#### Format Dokumentasi: UX Flow Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ UX FLOW ANALYSIS                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ HALAMAN: [Nama Halaman]                                             │
│ AKSES: [Bagaimana user sampai ke sini?]                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                    VISUAL HIERARCHY                            ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║  1. [Element yang pertama dilihat - paling menonjol]          ║  │
│  ║     ↓                                                          ║  │
│  ║  2. [Element kedua - biasanya Call to Action]                 ║  │
│  ║     ↓                                                          ║  │
│  ║  3. [Element ketiga - supporting info]                         ║  │
│  ║     ↓                                                          ║  │
│  ║  4. [Element keempat - detail]                                ║  │
│  ║     ↓                                                          ║  │
│  ║  5. [Element kelima - secondary actions]                      ║  │
│  ║                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                    USER JOURNEY                                ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║  Step 1: [Aksi user] → [Respons sistem] → [Evaluasi]         ║  │
│  ║      ↓                                                         ║  │
│  ║  Step 2: [Aksi user] → [Respons sistem] → [Evaluasi]         ║  │
│  ║      ↓                                                         ║  │
│  ║  Step 3: [Aksi user] → [Respons sistem] → [Evaluasi]         ║  │
│  ║      ↓                                                         ║  │
│  ║  ...                                                           ║  │
│  ║                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                    DECISION POINTS                            ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║  Q1: [Pertanyaan yang harus dijawab user]                    ║  │
│  ║      → [Pilihan yang tersedia]                               ║  │
│  ║      → [Konsekuensi pilihan]                                 ║  │
│  ║                                                               ║  │
│  ║  Q2: [Pertanyaan yang harus dijawab user]                    ║  │
│  ║      → [Pilihan yang tersedia]                               ║  │
│  ║      → [Konsekuensi pilihan]                                 ║  │
│  ║                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Studi Kasus: UX Flow Shopee Product Page

```
┌─────────────────────────────────────────────────────────────────────┐
│ UX FLOW ANALYSIS: Shopee Product Page                              │
├─────────────────────────────────────────────────────────────────────┤
│ AKSES: Search → Product Card Click / Recommendation Click          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║               FIRST 3 SECONDS (Eye Tracking)                  ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║  SECOND 1: Image Gallery (foto produk)                       ║  │
│  ║     → User memverifikasi produk sesuai ekspektasi             ║  │
│  ║                                                               ║  │
│  ║  SECOND 2: Price + Discount                                  ║  │
│  ║     → User menilai: "Apakah ini worth it?"                    ║  │
│  ║                                                               ║  │
│  ║  SECOND 3: Voucher + Promo Banner                             ║  │
│  ║     → User menilai: "Apakah ada kesempatan hemat?"            ║  │
│  ║                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                    DECISION FLOW                              ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║  [Produk sesuai ekspektasi?]                                  ║  │
│  ║       │                                                       ║  │
│  ║    Ya │ Tidak                                                 ║  │
│  ║       │                                                       ║  │
│  ║       ↓                                                       ║  │
│  ║  [Harga sesuai budget?]                                   ║  │
│  ║       │                                                       ║  │
│  ║    Ya │ Tidak                                                 ║  │
│  ║       │                                                       ║  │
│  ║       ↓                                                       ║  │
│  ║  [Cek voucher/promo?] ←┐                                     ║  │
│  ║       │               │                                     ║  │
│  ║    Ya │ Tidak         │                                     ║  │
│  ║       │               │                                     ║  │
│  ║       ↓               │                                     ║  │
│  ║  [Pilih variasi?]     │                                     ║  │
│  ║       │               │                                     ║  │
│  ║    Ya │ Tidak         │                                     ║  │
│  ║       │               │                                     ║  │
│  ║       ↓               │                                     ║  │
│  ║  [Tambah ke keranjang?] ─┘                                   ║  │
│  ║       │                                                       ║  │
│  ║       ↓                                                       ║  │
│  ║  [Checkout / Lanjut belanja]                                  ║  │
│  ║                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                    CLICK DEPTH ANALYSIS                       ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║  KE TUJUAN: Checkout                                          ║  │
│  ║  ┌─────────────────────────────────────────────────────────┐   ║  │
│  ║  │ Click 0: Product Page                                  │   ║  │
│  ║  │ Click 1: Select Variant (jika perlu)                   │   ║  │
│  ║  │ Click 2: Add to Cart                                   │   ║  │
│  ║  │ Click 3: Cart Icon / View Cart                          │   ║  │
│  ║  │ Click 4: Checkout Button                                │   ║  │
│  ║  │ Click 5: Select Address                                 │   ║  │
│  ║  │ Click 6: Select Payment                                 │   ║  │
│  ║  │ Click 7: Place Order                                    │   ║  │
│  ║  └─────────────────────────────────────────────────────────┘   ║  │
│  ║                                                               ║  │
│  ║  MINIMAL: 3 clicks (Quick Buy)                                ║  │
│  ║  NORMAL: 5-7 clicks (Add to Cart → Checkout)                   ║  │
│  ║                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### UX Audit Checklist

```
┌─────────────────────────────────────────────────────────────────────┐
│ UX AUDIT CHECKLIST                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  □ VISUAL HIERARCHY                                                │
│    □ Apa yang terlihat pertama? Apakah itu yang TERBAIK?          │
│    □ Apakah ada visual hierarchy yang jelas?                      │
│    □ Apakah elemen penting lebih menonjol?                         │
│    □ Apakah noise visual diminimalkan?                             │
│                                                                     │
│  □ INTERACTION PATTERNS                                            │
│    □ Berapa klik sampai tujuan utama?                              │
│    □ Apakah ada shortcut untuk user berpengalaman?                 │
│    □ Apakah gesture support cukup intuitif?                       │
│    □ Apakah state transitions smooth?                              │
│                                                                     │
│  □ ERROR HANDLING                                                  │
│    □ Apa yang terjadi jika stok habis?                             │
│    □ Apa yang terjadi jika koneksi terputus?                       │
│    □ Apa yang terjadi jika payment gagal?                         │
│    □ Apakah pesan error helpful atau sekadar "Error occurred"?     │
│    □ Apakah recovery path jelas?                                   │
│                                                                     │
│  □ LOADING STATES                                                  │
│    □ Apakah skeleton loading digunakan?                            │
│    □ Apakah ada progress indicator?                                │
│    □ Apakah loading terasa cepat (perceived performance)?          │
│    □ Apakah bisa interaksi saat loading?                          │
│                                                                     │
│  □ EMPTY STATES                                                    │
│    □ Apa yang ditampilkan saat tidak ada data?                     │
│    □ Apakah ada guidance untuk mengisi?                           │
│    □ Apakah empty state masih terlihat bagus?                     │
│                                                                     │
│  □ FEEDBACK LOOPS                                                  │
│    □ Apakah aksi langsung memberikan feedback visual?              │
│    □ Apakah sukses/eror dikomunikasikan dengan jelas?              │
│    □ Apakah ada haptic/animasi sebagai reinforcement?               │
│                                                                     │
│  □ ACCESSIBILITY                                                   │
│    □ Apakah color contrast cukup?                                  │
│    □ Apakah touch target cukup besar?                              │
│    □ Apakah screen reader friendly?                                │
│    □ Apakah keyboard navigation berfungsi?                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Layer 3: Business Flow

#### Definisi

Layer ini mendokumentasikan **semua proses bisnis** yang berjalan di balik layar. Dari perspektif pengguna, ini adalah "apa yang terjadi" setelah mereka menekan tombol. Dari perspektif sistem, ini adalah **端到端业务流程** lengkap.

#### Mengapa Layer Ini Penting

```
UI告诉用户"有什么"
UX告诉用户"怎么用"
Business Flow告诉"为什么"和"什么在发生"

Tanpa memahami business flow, kita hanya membangun
fasad — tampilan luar tanpa logika di baliknya.

Contoh:
- User klik "Checkout"
- Di UI, hanya button berubah state
- Tapi di balik layar, ada:
  * Validasi cart
  * Cek stock
  * Hitung harga (dengan promo/voucher)
  * Generate order
  * Lock inventory
  * Hitung ongkir
  * Prepare payment
  * Create analytics event
  * Update recommendation model
  * Send notification

SEMUA ITU harus kita pahami.
```

#### Pertanyaan Kunci

```
1. Apa yang terjadi SEBELUM halaman ini load?
2. Apa yang terjadi SAAT user berinteraksi?
3. Apa yang terjadi SETELAH interaksi selesai?
4. Event apa yang dipicu di setiap langkah?
5. Data apa yang berubah di setiap langkah?
6. Service/Modul apa yang terlibat?
7. Apa yang terjadi jika ada error di tengah jalan?
8. Rollback seperti apa yang terjadi?
```

#### Format Dokumentasi: Business Flow Diagram

Gunakan notasi berikut untuk diagram:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BUSINESS FLOW TEMPLATE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRIGGER: [Apa yang memulai flow ini?]                              │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │   START    │                                                    │
│  └──────┬──────┘                                                    │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────┐                                                    │
│  │   STEP 1    │  ← Aksi/Trigger                                   │
│  │ [Deskripsi] │                                                    │
│  └──────┬──────┘                                                    │
│         │                                                           │
│         ├──────────────────────┐                                   │
│         │                      │                                   │
│         ▼                      ▼                                   │
│  ┌─────────────┐          ┌─────────────┐                          │
│  │   STEP 2A   │          │   STEP 2B   │  ← Branch/Condition      │
│  │ [Deskripsi] │          │ [Deskripsi] │                          │
│  └──────┬──────┘          └──────┬──────┘                          │
│         │                      │                                   │
│         └──────────┬───────────┘                                   │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────┐    │    ┌─────────────┐                           │
│  │   STEP 3    │◄───┴───►│   ERROR     │  ← Error Handling         │
│  │ [Deskripsi] │         │   HANDLER   │                           │
│  └──────┬──────┘         └─────────────┘                           │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │   OUTPUT    │  ← Data yang dihasilkan                        │
│  │ [Deskripsi] │                                                │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │    END      │                                                │
│  └─────────────┘                                                │
│                                                                     │
│  ════════════════════════════════════════════════════════════════  │
│                                                                     │
│  INVOLVED SERVICES: [Daftar service/modul yang terlibat]          │
│  DATABASE TABLES: [Daftar tabel yang di-read/write]                 │
│  EVENTS FIRED: [Daftar analytics/event yang dipublish]             │
│  SIDE EFFECTS: [Efek samping yang terjadi]                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Studi Kasus: Shopee Checkout Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ BUSINESS FLOW: Checkout Process                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRIGGER: User klik "Checkout" atau "Beli Sekarang"                 │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  ┌─────────────┐                                                   │
│  │   START     │                                                   │
│  └──────┬──────┘                                                   │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: INITIALIZE CHECKOUT                                │   │
│  │                                                             │   │
│  │ - Validate user session                                    │   │
│  │ - Load cart items                                          │   │
│  │ - Check cart validity (stock, price, restrictions)         │   │
│  │ - Load user address book                                   │   │
│  │ - Load available vouchers                                   │   │
│  │ - Load user loyalty points                                  │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: ADDRESS SELECTION                                 │   │
│  │                                                             │   │
│  │ - Display saved addresses                                   │   │
│  │ - Allow add/edit address                                   │   │
│  │ - Calculate shipping options based on address              │   │
│  │ - Update shipping fee                                      │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: SHIPPING SELECTION                                  │   │
│  │                                                             │   │
│  │ - Display available couriers                                │   │
│  │ - Show delivery estimates                                  │   │
│  │ - Apply shipping insurance (if applicable)                 │   │
│  │ - Update total                                              │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: VOUCHER/PROMO APPLICATION ◄──┐                     │   │
│  │                                         │                     │   │
│  │ - Display available vouchers           │                     │   │
│  │ - Check voucher eligibility ──────────┘                     │   │
│  │   (min spend, category, date)            │                   │   │
│  │ - Apply auto-voucher if matched         │                   │   │
│  │ - Calculate discount                    │                   │   │
│  │ - Update total                          │                   │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 5: PAYMENT METHOD SELECTION                            │   │
│  │                                                             │   │
│  │ - Display payment options (e-wallet, bank, cod)             │   │
│  │ - Filter by availability                                    │   │
│  │ - Apply payment method promotions                           │   │
│  │ - Show payment instructions                                 │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 6: ORDER SUMMARY                                       │   │
│  │                                                             │   │
│  │ - Display final order summary                               │   │
│  │ - Show item breakdown                                       │   │
│  │ - Show discount breakdown                                   │   │
│  │ - Show total to pay                                         │   │
│  │ - Show terms and conditions                                 │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 7: PLACE ORDER                                         │   │
│  │                                                             │   │
│  │ - Final validation                                          │   │
│  │ - Lock prices (prevent price change)                       │   │
│  │ - Reserve inventory                                         │   │
│  │ - Create order record                                       │   │
│  │ - Deduct wallet balance (if prepaid)                       │   │
│  │ - Generate payment reference                               │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│              ┌───────────────┴───────────────┐                     │
│              ▼                               ▼                     │
│  ┌─────────────────────┐           ┌─────────────────────┐           │
│  │    SUCCESS PATH     │           │    ERROR PATH       │           │
│  │                     │           │                     │           │
│  │ - Redirect to      │           │ - Display error     │           │
│  │   payment page     │           │ - Suggest recovery  │           │
│  │ - Show order ID    │           │ - Log error         │           │
│  │ - Start timeout    │           │ - Release locks     │           │
│  │   for payment      │           │                     │           │
│  └─────────────────────┘           └─────────────────────┘           │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  INVOLVED SERVICES:                                                │
│  - Cart Service                                                     │
│  - User Service                                                     │
│  - Address Service                                                 │
│  - Shipping Service                                                 │
│  - Voucher Service                                                 │
│  - Payment Service                                                 │
│  - Order Service                                                   │
│  - Inventory Service                                              │
│  - Notification Service                                            │
│  - Analytics Service                                               │
│                                                                     │
│  DATABASE TABLES:                                                  │
│  - orders                                                          │
│  - order_items                                                      │
│  - order_payments                                                   │
│  - inventory_locks                                                  │
│  - user_addresses                                                  │
│  - vouchers                                                        │
│  - shipping_rates                                                  │
│                                                                     │
│  EVENTS FIRED:                                                     │
│  - checkout_started                                                 │
│  - address_selected                                                │
│  - shipping_selected                                               │
│  - voucher_applied                                                 │
│  - payment_method_selected                                          │
│  - order_placed                                                    │
│  - payment_initiated                                               │
│                                                                     │
│  SIDE EFFECTS:                                                     │
│  - Recommendation engine updates based on checkout intent          │
│  - Recently viewed updated                                         │
│  - Search ranking may be influenced                               │
│  - Push notification scheduled                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Business Flow Mapping Template

```
┌─────────────────────────────────────────────────────────────────────┐
│ HALAMAN/FITUR: [Nama]                                              │
│ TARGET: [Aplikasi yang diaudit]                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRIGGER:                                                           │
│  ____________________________________________________________      │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  [GAMBARKAN FLOW DISINI - gunakan simbol:                          │
│                                                                     │
│    ┌───────┐                                                       │
│    │ START │     ← Initial trigger                                 │
│    └───┬───┘                                                       │
│        │                                                           │
│        ▼                                                           │
│    ┌───────┐                                                       │
│    │ STEP  │     ← Proses/Aksi                                      │
│    └───┬───┘                                                       │
│        │                                                           │
│    ┌───┴───┐                                                       │
│    │       │                                                       │
│    ▼       ▼                                                       │
│  ┌───┐   ┌───┐    ← Branch (kondisi)                               │
│  │ A │   │ B │                                                     │
│  └───┘   └───┘                                                     │
│        │                                                           │
│        ▼                                                           │
│    ┌───────┐                                                       │
│    │ ERROR │     ← Error handling                                   │
│    └───┬───┘                                                       │
│        │                                                           │
│        ▼                                                           │
│    ┌───────┐                                                       │
│    │ END   │     ← Selesai                                          │
│    └───────┘                                                       │
│  ]                                                                  │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  INVOLVED SERVICES:                                                │
│  □ _______________                                                  │
│  □ _______________                                                  │
│  □ _______________                                                  │
│                                                                     │
│  DATABASE OPERATIONS:                                              │
│  □ _______________ (Read)                                          │
│  □ _______________ (Write)                                          │
│  □ _______________ (Update)                                        │
│  □ _______________ (Delete)                                        │
│                                                                     │
│  EVENTS/ANALYTICS:                                                 │
│  □ _______________                                                 │
│  □ _______________                                                 │
│  □ _______________                                                 │
│                                                                     │
│  SIDE EFFECTS:                                                     │
│  □ _______________                                                 │
│  □ _______________                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Layer 4: State Management

#### Definisi

Layer ini mengidentifikasi **semua data yang "diingat"** oleh aplikasi, baik di sisi client maupun server. Memahami state management membantu kita menentukan arsitektur frontend yang tepat.

#### Mengapa Layer Ini Penting

```
State management menentukan:
- User experience (responsif vs lambat)
- Arsitektur frontend (simple vs complex)
- Server load (banyak request vs cached)
- Offline capability

Applikasi modern punya state yang kompleks.
Memahami state management membantu kita:
1. Menentukan apa yang harus di-cache
2. Menentukan apa yang harus di-sync
3. Menentukan optimasi yang diperlukan
4. Menentukan strategi offline-first
```

#### Kategori State

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE CATEGORIZATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SERVER STATE (Persistent, Shared)                               │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - User profile                                         │     │
│     │ - Cart items                                          │     │
│     │ - Order history                                       │     │
│     │ - Wishlist                                            │     │
│     │ - Saved addresses                                     │     │
│     │ - Vouchers/Coupons                                    │     │
│     │ - Notifications (unread count)                        │     │
│     │ - Product catalog                                     │     │
│     │ - Inventory status                                    │     │
│     │ - Prices                                              │     │
│     │ - Reviews/Ratings                                     │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  2. CLIENT STATE (Ephemeral, Local)                                │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Theme (light/dark)                                   │     │
│     │ - Sidebar collapsed state                             │     │
│     │ - Modal visibility                                    │     │
│     │ - Form inputs (unsubmitted)                           │     │
│     │ - Loading states                                      │     │
│     │ - Error states                                        │     │
│     │ - Toast notifications                                 │     │
│     │ - Current scroll position                            │     │
│     │ - Active filters                                      │     │
│     │ - Search query                                       │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  3. URL STATE (Shareable, Bookmarkable)                            │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Current page                                        │     │
│     │ - Search query                                       │     │
│     │ - Filters                                            │     │
│     │ - Sort order                                         │     │
│     │ - Selected product ID                                │     │
│     │ - Pagination                                         │     │
│     │ - Tab selection                                       │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  4. DERIVED STATE (Computed from other states)                      │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Cart total (sum of item prices)                     │     │
│     │ - Filtered product list                               │     │
│     │ - Search results                                      │     │
│     │ - Paginated data                                      │     │
│     │ - Cart item count                                     │     │
│     │ - Is logged in (derived from user state)             │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Format Dokumentasi: State Audit

```
┌─────────────────────────────────────────────────────────────────────┐
│ STATE AUDIT: [Nama Halaman/Fitur]                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ SERVER STATE (API Required)                                   │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ NO  │ STATE         │ SOURCE      │ SYNC STRATEGY  │ STALE   │ │
│  ├─────┼───────────────┼─────────────┼────────────────┼──────────┤ │
│  │ 1   │               │             │ □ Real-time   │ □ Yes   │ │
│  │     │               │             │ □ Polling      │ □ No    │ │
│  │     │               │             │ □ On-demand   │         │ │
│  │     │               │             │ □ Cached       │         │ │
│  ├─────┼───────────────┼─────────────┼────────────────┼──────────┤ │
│  │ 2   │               │             │ □ Real-time    │ □ Yes   │ │
│  │     │               │             │ □ Polling      │ □ No    │ │
│  │     │               │             │ □ On-demand   │         │ │
│  │     │               │             │ □ Cached       │         │ │
│  └─────┴───────────────┴─────────────┴────────────────┴──────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ CLIENT STATE (Local Storage / Memory)                         │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ NO  │ STATE         │ STORAGE     │ INITIAL VALUE   │ PERSIST│ │
│  ├─────┼───────────────┼─────────────┼─────────────────┼────────┤ │
│  │ 1   │               │ □ Memory    │                 │ □ Yes │ │
│  │     │               │ □ Session   │                 │ □ No  │ │
│  │     │               │ □ Local     │                 │        │ │
│  │     │               │ □ Cookie    │                 │        │ │
│  ├─────┼───────────────┼─────────────┼─────────────────┼────────┤ │
│  │ 2   │               │ □ Memory    │                 │ □ Yes │ │
│  │     │               │ □ Session   │                 │ □ No  │ │
│  │     │               │ □ Local     │                 │        │ │
│  │     │               │ □ Cookie    │                 │        │ │
│  └─────┴───────────────┴─────────────┴─────────────────┴────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ URL STATE (Query Parameters)                                  │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ PARAM       │ DEFAULT      │ DESCRIPTION          │ SHARABLE│ │
│  ├─────────────┼───────────────┼──────────────────────┼─────────┤ │
│  │             │               │                      │ □ Yes   │ │
│  │             │               │                      │ □ No    │ │
│  ├─────────────┼───────────────┼──────────────────────┼─────────┤ │
│  │             │               │                      │ □ Yes   │ │
│  │             │               │                      │ □ No    │ │
│  └─────────────┴───────────────┴──────────────────────┴─────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ CROSS-PAGE STATE (Global Store)                               │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ STATE         │ ACCESS PATTERN     │ UPDATE FREQUENCY │ SYNC │ │
│  ├───────────────┼─────────────────────┼──────────────────┼──────┤ │
│  │ User Session  │ Header, Footer     │ Per session     │ N/A  │ │
│  │ Cart Count    │ All pages          │ Every cart ops  │ Server│ │
│  │ Notifications │ Header, Dashboard  │ Real-time       │ Server│ │
│  │ Theme         │ All pages          │ On change       │ Local │ │
│  └───────────────┴─────────────────────┴──────────────────┴──────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Sync Strategy Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                 SYNC STRATEGY DECISION MATRIX                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PILIH STRATEGI BERDASARKAN:                                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ REAL-TIME (WebSocket/SSE)                                       ││
│  │                                                                 ││
│  │ Gunanya untuk:                                                  ││
│  │ - Stock yang berubah cepat                                     ││
│  │ - Live chat                                                     ││
│  │ - Notification real-time                                      ││
│  │ - Live bidding/auction                                        ││
│  │ - Collaborative features                                      ││
│  │                                                                 ││
│  │ Contoh: "X orang sedang melihat produk ini"                    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ POLLING (Interval-based)                                        ││
│  │                                                                 ││
│  │ Gunanya untuk:                                                  ││
│  │ - Data yang berubah moderate (1-5 menit)                      ││
│  │ - Order status tracking                                        ││
│  │ - Leaderboard                                                  ││
│  │                                                                 ││
│  │ Contoh: Cek status order setiap 30 detik                       ││
│  │ Interval: 30s - 5min                                           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ON-DEMAND (Fetch on mount/action)                               ││
│  │                                                                 ││
│  │ Gunanya untuk:                                                  ││
│  │ - Static/semi-static data                                      ││
│  │ - Data yang jarang berubah                                     ││
│  │ - Initial page load                                             ││
│  │                                                                 ││
│  │ Contoh: Product detail (bisa di-cache lama)                    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ CACHED (Store locally, invalidate on need)                      ││
│  │                                                                 ││
│  │ Gunanya untuk:                                                  ││
│  │ - User preferences                                             ││
│  │ - Recently viewed                                               ││
│  │ - Search history                                               ││
│  │ - Draft data                                                    ││
│  │                                                                 ││
│  │ Strategi: Cache-first, validate in background                   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Layer 5: API Reverse Engineering

#### Definisi

Layer ini mengidentifikasi **semua endpoint API** yang dibutuhkan untuk membuat halaman berfungsi. Menggunakan browser developer tools untuk menangkap network traffic.

#### Mengapa Layer Ini Penting

```
API adalah kontrak antara frontend dan backend.
Dengan memahami API, kita bisa:
1. Merancang backend yang sesuai kebutuhan frontend
2. Menentukan strategi caching yang tepat
3. Menentukan optimasi yang diperlukan
4. Memahami data yang dibutuhkan

Catatan penting:
- Kita TIDAK perlu API yang sama persis
- Kita perlu API dengan CAPABILITY yang sama
- Approach bisa berbeda, hasil akhir sama
```

#### Tools untuk API Reverse Engineering

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API DISCOVERY TOOLS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. BROWSER DEVTOOLS                                               │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ Network Tab                                              │     │
│     │ - Filter by: XHR, Fetch, WS                            │     │
│     │ - Capture all API requests                              │     │
│     │ - Analyze request/response                              │     │
│     │ - Copy as cURL                                          │     │
│     │                                                         │     │
│     │ Tips:                                                   │     │
│     │ - Clear network log before action                       │     │
│     │ - Do the action once                                    │     │
│     │ - Filter noise with "domain:api" pattern                │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  2. PROXY TOOLS                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ Charles Proxy / Proxyman                               │     │
│     │ - Intercept HTTPS traffic                              │     │
│     │ - Map responses                                         │     │
│     │ - Rewrite requests                                      │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  3. MOBILE SNIFFING                                                 │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ Proxyman (Mobile)                                       │     │
│     │ - Setup proxy on mobile device                          │     │
│     │ - Capture mobile app traffic                            │     │
│     │ - Export as HAR file                                    │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  4. HAR FILE ANALYSIS                                               │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ Chrome DevTools → Network → Save all as HAR            │     │
│     │ Tools: HAR Viewer, HAR Analyzer                         │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Format Dokumentasi: API Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ API MAP: [Nama Halaman/Fitur]                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ ENDPOINT ANALYSIS                                              │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ NO │ METHOD │ ENDPOINT              │ PURPOSE    │ DATA     │ │
│  ├─────┼────────┼───────────────────────┼────────────┼──────────┤ │
│  │ 1   │ GET    │ /api/v1/products/:id │ Get detail │ Response:│ │
│  │     │        │                       │            │ Product  │ │
│  │     │        │                       │            │ data     │ │
│  ├─────┼────────┼───────────────────────┼────────────┼──────────┤ │
│  │ 2   │ GET    │ /api/v1/products/:id  │ Get prices │ Response:│ │
│  │     │        │ /prices               │            │ Price,   │ │
│  │     │        │                       │            │ discount │ │
│  ├─────┼────────┼───────────────────────┼────────────┼──────────┤ │
│  │ 3   │ GET    │ /api/v1/products/:id  │ Get        │ Response:│ │
│  │     │        │ /variants             │ variants   │ Options  │ │
│  ├─────┼────────┼───────────────────────┼────────────┼──────────┤ │
│  │ ... │ ...    │ ...                   │ ...        │ ...      │ │
│  └─────┴────────┴───────────────────────┴────────────┴──────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ AGGREGATION ANALYSIS                                            │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │ Initial assumption: Satu halaman butuh banyak endpoint        │ │
│  │                                                                 │ │
│  │ Analysis:                                                        │ │
│  │ □ Single endpoint dengan nested response                       │ │
│  │ □ Multiple parallel requests                                   │ │
│  │ □ Hydration pattern (base + delta)                            │ │
│  │ □ CDN-cached static + dynamic overlay                          │ │
│  │                                                                 │ │
│  │ Recommended approach untuk implementasi kita:                  │ │
│  │ ________________________________________________________________│ │
│  │                                                                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ RESPONSE SCHEMA                                                 │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │ Product Response Example:                                      │ │
│  │                                                                 │ │
│  │ {                                                               │ │
│  │   "id": "prod_123",                                            │ │
│  │   "name": "Product Name",                                       │ │
│  │   "description": "...",                                        │ │
│  │   "price": {                                                    │ │
│  │     "original": 100000,                                        │ │
│  │     "current": 75000,                                          │ │
│  │     "discount": 25                                             │ │
│  │   },                                                            │ │
│  │   "variants": [...],                                           │ │
│  │   "media": [...],                                              │ │
│  │   "seller": {...},                                             │ │
│  │   "stats": {                                                    │ │
│  │     "rating": 4.5,                                             │ │
│  │     "reviewCount": 1234,                                       │ │
│  │     "soldCount": 5000                                          │ │
│  │   }                                                            │ │
│  │ }                                                               │ │
│  │                                                                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### API Design Considerations

```
┌─────────────────────────────────────────────────────────────────────┐
│                 API DESIGN DECISION FRAMEWORK                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. REQUEST/RESPONSE STRUCTURE                                      │
│                                                                     │
│     CONSIDERATION          │ MONOLITH        │ MICROSERVICE        │
│     ─────────────────────────────────────────────────────────       │
│     Data aggregation       │ Single query    │ GraphQL/BFF         │
│     Response size          │ Larger, more    │ Smaller, tailored   │
│     Over-fetching          │ Common          │ Avoided             │
│     Under-fetching         │ Rare            │ Possible            │
│                                                                     │
│  2. PAGINATION STRATEGY                                              │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ OFFSET-BASED                                              │     │
│     │ Pros: Simple, predictable                                │     │
│     │ Cons: Inconsistent on dynamic data                      │     │
│     │ Use: Static lists, search results                       │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ CURSOR-BASED                                              │     │
│     │ Pros: Consistent, performant on large datasets           │     │
│     │ Cons: No random access                                  │     │
│     │ Use: Feeds, timelines, real-time lists                  │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  3. CACHING STRATEGY                                                │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ CDN CACHE (Edge)                                        │     │
│     │ - Static content (images, configs)                      │     │
│     │ - TTL: Hours to days                                    │     │
│     │ - Cache-Control header                                  │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ APPLICATION CACHE (Redis/Memory)                        │     │
│     │ - Dynamic but stable data (products)                   │     │
│     │ - TTL: Minutes to hours                                 │     │
│     │ - Cache invalidation strategy needed                    │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ CLIENT CACHE (Local/Browser)                            │     │
│     │ - User-specific data                                    │     │
│     │ - TTL: Session to persistent                           │     │
│     │ - SWR pattern for revalidation                          │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Layer 6: Database Reverse Engineering

#### Definisi

Layer ini mengidentifikasi **struktur data** yang dibutuhkan untuk mendukung semua fitur. Dari observasi UI dan behavior, kita menebak tabel-tabel yang diperlukan.

#### Mengapa Layer Ini Penting

```
Database adalah fondasi.
Dengan memahami struktur data yang dibutuhkan:
1. Kita bisa merancang schema yang tepat
2. Kita bisa menentukan relationship antar entitas
3. Kita bisa mengidentifikasi data yang perlu di-index
4. Kita bisa merencanakan query optimization

Ingat: Kita tidak melihat database mereka secara langsung.
Kita MENDEKATI database design dari behavior aplikasi.
```

#### Pattern Recognition

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE PATTERN RECOGNITION                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FITUR BEHAVIOR          →  PREDIKSI STRUKTUR DATA                  │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  "User bisa menyimpan    →  wishlist                                 │
│   produk favorit"       │    - id                                   │
│                          │    - user_id                              │
│                          │    - product_id                           │
│                          │    - created_at                           │
│                          │                                           │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  "User bisa memilih      →  product_variants                         │
│   warna dan ukuran"      │    - id                                   │
│                          │    - product_id                          │
│                          │    - variant_type (color/size)           │
│                          │    - variant_value (red/XL)              │
│                          │    - sku                                 │
│                          │    - price_adjustment                    │
│                          │                                           │
│                          →  inventory                               │
│                          │    - variant_id                          │
│                          │    - quantity                            │
│                          │    - reserved_quantity                   │
│                          │                                           │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  "User bisa memberikan   →  reviews                                  │
│   rating dan review"     │    - id                                   │
│                          │    - user_id                              │
│                          │    - product_id                          │
│                          │    - order_id                            │
│                          │    - rating (1-5)                        │
│                          │    - comment                             │
│                          │    - photos                              │
│                          │    - created_at                          │
│                          │    - verified_purchase                   │
│                          │                                           │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  "Seller bisa upload     →  product_media                            │
│   foto dan video"        │    - id                                   │
│                          │    - product_id                          │
│                          │    - media_type (image/video)             │
│                          │    - url                                 │
│                          │    - thumbnail_url                       │
│                          │    - display_order                       │
│                          │    - is_primary                          │
│                          │                                           │
└─────────────────────────────────────────────────────────────────────┘
```

#### Format Dokumentasi: Database Schema Draft

```
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE SCHEMA DRAFT: [Nama Modul]                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MODULE: [Nama modul/fitur]                                         │
│  BASED ON: [Observasi dari layer sebelumnya]                       │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TABLE: [nama_tabel]                                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ Kolom:                                                       │   │
│  │ ┌─────────────────┬──────────────┬────────────┬─────────┐  │   │
│  │ │ COLUMN           │ TYPE         │ CONSTRAINT│ NOTE    │  │   │
│  │ ├─────────────────┼──────────────┼────────────┼─────────┤  │   │
│  │ │ id               │ UUID         │ PK         │         │  │   │
│  │ │ [column_name]    │ [type]       │ [keys]     │         │  │   │
│  │ │                 │              │            │         │  │   │
│  │ └─────────────────┴──────────────┴────────────┴─────────┘  │   │
│  │                                                             │   │
│  │ Indexes:                                                    │   │
│  │ - idx_[column] ON [table]([column])                        │   │
│  │ - idx_[columns] ON [table]([col1], [col2])                │   │
│  │                                                             │   │
│  │ Relationships:                                             │   │
│  │ - [table].[column] → [other_table].[column]                 │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ENTITY RELATIONSHIP                                          │   │
│  │                                                             │   │
│  │     ┌──────────┐         ┌──────────┐         ┌──────────┐   │   │
│  │     │  users   │ 1    N │ orders   │ N    1 │products │   │   │
│  │     └──────────┘─────────└──────────┘─────────└──────────┘   │   │
│  │           │                                        │        │   │
│  │           │ 1                                   1 │        │   │
│  │           │                                    │          │   │
│  │           ▼                                    ▼          │   │
│  │     ┌──────────┐                         ┌──────────┐       │   │
│  │     │ reviews  │                         │wishlists │       │   │
│  │     └──────────┘                         └──────────┘       │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ QUERY PATTERNS (Based on observed behavior)                  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ Pattern 1: Get user's [entity] list                        │   │
│  │   → SELECT * FROM [table] WHERE user_id = ? ORDER BY ...    │   │
│  │                                                             │   │
│  │ Pattern 2: Get [entity] detail with relations              │   │
│  │   → SELECT * FROM [table] t                                │   │
│  │     JOIN [relation] r ON t.id = r.[table_id]               │   │
│  │     WHERE t.id = ?                                         │   │
│  │                                                             │   │
│  │ Pattern 3: Search/filter [entity]                          │   │
│  │   → SELECT * FROM [table]                                  │   │
│  │     WHERE [search_column] ILIKE ?                           │   │
│  │     ORDER BY [score]                                       │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Layer 7: Business Rules

#### Definisi

Layer ini mengidentifikasi **semua logika bisnis** yang menentukan bagaimana data diproses. Seringkali ini adalah layer yang paling tidak terlihat tapi paling kritis.

#### Mengapa Layer Ini Penting

```
Business rules adalah "otak" di balik aplikasi.
UI bisa terlihat sama, tapi business rules yang berbeda
membuat aplikasi BEHAVIOR berbeda.

Contoh:
- Voucher Shopee: Minimal belanja Rp100.000
- Voucher kita: Minimal belanja Rp50.000

UI hampir sama, tapi IMPACT berbeda.

Tanpa mendokumentasikan business rules:
1. Implementasi akan inkonsisten
2. Edge cases akan terlewat
3. Testing akan tidak komprehensif
4. Maintenance akan sulit
```

#### Kategori Business Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BUSINESS RULES CATEGORIES                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PRICING RULES                                                   │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Discount calculation (percentage, fixed, tiered)      │     │
│     │ - Minimum purchase amount                               │     │
│     │ - Maximum discount cap                                  │     │
│     │ - Stacking rules (can combine with other promos?)       │     │
│     │ - Price lock duration (when price changes mid-cart)     │     │
│     │ - Regional pricing                                     │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  2. INVENTORY RULES                                                 │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Stock deduction timing (order vs payment)            │     │
│     │ - Reservation duration (how long to hold stock)        │     │
│     │ - Oversell prevention (can stock go negative?)         │     │
│     │ - Multi-warehouse allocation                           │     │
│     │ - Low stock threshold                                  │     │
│     │ - Backorder policy                                     │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  3. VOUCHER/PROMO RULES                                             │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Minimum spend                                        │     │
│     │ - Maximum discount                                      │     │
│     │ - Category restrictions                                │     │
│     │ - Product restrictions                                  │     │
│     │ - User eligibility (new user, tier, never used)        │     │
│     │ - Usage quota (per user, total)                        │     │
│     │ - Validity period                                       │     │
│     │ - Stacking rules                                       │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  4. ORDER RULES                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Order cancellation window                             │     │
│     │ - Cancellation reasons                                  │     │
│     │ - Refund processing time                               │     │
│     │ - Return window                                         │     │
│     │ - Partial return rules                                  │     │
│     │ - Address change window                                │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  5. USER/GROWTH RULES                                               │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ - Welcome discount eligibility                         │     │
│     │ - Point earning rate                                    │     │
│     │ - Point expiration                                     │     │
│     │ - Loyalty tier thresholds                              │     │
│     │ - Referral reward structure                            │     │
│     │ - First purchase guarantee                             │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Format Dokumentasi: Business Rules Specification

```
┌─────────────────────────────────────────────────────────────────────┐
│ BUSINESS RULES: [Nama Fitur/Rule Set]                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ RULE: [Nama Aturan]                                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ DESCRIPTION:                                               │   │
│  │ [Penjelasan lengkap tentang aturan ini]                     │   │
│  │                                                             │   │
│  │ ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │ TRIGGER:                                                    │   │
│  │ [Kondisi yang memicu aturan ini]                           │   │
│  │                                                             │   │
│  │ CONDITIONS:                                                 │   │
│  │ □ [condition_1]                                            │   │
│  │ □ [condition_2]                                            │   │
│  │ □ ALL conditions must be true                              │   │
│  │ □ ANY condition must be true                               │   │
│  │                                                             │   │
│  │ ACTIONS:                                                    │   │
│  │ □ [action_1]                                                │   │
│  │ □ [action_2]                                                │   │
│  │                                                             │   │
│  │ ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │ EXAMPLES:                                                   │   │
│  │                                                             │   │
│  │ Example 1: [Happy path]                                     │   │
│  │   Input: ___________                                       │   │
│  │   Expected Output: ___________                             │   │
│  │                                                             │   │
│  │ Example 2: [Edge case]                                      │   │
│  │   Input: ___________                                       │   │
│  │   Expected Output: ___________                             │   │
│  │                                                             │   │
│  │ Example 3: [Boundary]                                       │   │
│  │   Input: ___________                                       │   │
│  │   Expected Output: ___________                             │   │
│  │                                                             │   │
│  │ ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │ ERROR HANDLING:                                            │   │
│  │ If [error condition]:                                      │   │
│  │   Show: [error message]                                    │   │
│  │   Log: [error details]                                     │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Contoh: Voucher Business Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│ BUSINESS RULES: Voucher System                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ RULE: Voucher Eligibility Check                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ TRIGGER: User applies voucher at checkout                   │   │
│  │                                                             │   │
│  │ CONDITIONS:                                                 │   │
│  │ □ User is logged in                                        │   │
│  │ □ Voucher code is valid (exists, not expired)              │   │
│  │ □ User has not used this voucher (if single-use)           │   │
│  │ □ Cart total >= minimum_spend                              │   │
│  │ □ Cart contains eligible products (if restricted)         │   │
│  │ □ User belongs to eligible user tier (if tier-restricted) │   │
│  │ □ Voucher quota not exhausted                              │   │
│  │ □ User hasn't exceeded daily usage limit                   │   │
│  │                                                             │   │
│  │ ACTIONS:                                                    │   │
│  │ □ If ALL pass: Apply discount, show success               │   │
│  │ □ If ANY fail: Show specific error message                │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ RULE: Discount Calculation                                  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ TYPE 1: Percentage Discount                                  │   │
│  │   Calculation: cart_subtotal * (discount_percent / 100)   │   │
│  │   Cap: min(discounted_amount, max_discount)                │   │
│  │                                                             │   │
│  │ TYPE 2: Fixed Discount                                      │   │
│  │   Calculation: fixed_amount                                │   │
│  │   Cap: min(fixed_amount, cart_subtotal)                   │   │
│  │                                                             │   │
│  │ TYPE 3: Free Shipping                                       │   │
│  │   Calculation: shipping_fee (waived)                       │   │
│  │   Condition: shipping_fee <= max_shipping_covered          │   │
│  │                                                             │   │
│  │ TYPE 4: Buy X Get Y                                         │   │
│  │   Calculation: Discount = price_of_y_item * discount_pct   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ RULE: Voucher Stacking                                       │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ Stacking Rules Matrix:                                       │   │
│  │                                                             │   │
│  │ ┌────────────────┬─────────┬─────────┬─────────┬─────────┐ │   │
│  │ │                │ Shop    │ Free    │ Discount│ Promo  │ │   │
│  │ │                │ Voucher │ Ship    │ Code    │ Price  │ │   │
│  │ ├────────────────┼─────────┼─────────┼─────────┼─────────┤ │   │
│  │ │ Shop Voucher   │   ❌    │   ✅   │   ✅   │   ✅   │ │   │
│  │ │ Free Shipping  │   ✅   │   ❌    │   ✅   │   ✅   │ │   │
│  │ │ Discount Code │   ✅   │   ✅   │   ❌    │   ✅   │ │   │
│  │ │ Promo Price    │   ✅   │   ✅   │   ✅   │   ❌    │ │   │
│  │ └────────────────┴─────────┴─────────┴─────────┴─────────┘ │   │
│  │                                                             │   │
│  │ Legend:                                                     │   │
│  │ ✅ = Can stack                                              │   │
│  │ ❌ = Cannot stack                                          │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Layer 8: Architecture

#### Definisi

Layer terakhir ini menyatukan semua insights dari layer sebelumnya menjadi **arsitektur sistem yang koheren**. Di sini kita menentukan bagaimana backend dan frontend diatur.

#### Mengapa Layer Ini Penting

```
Architecture adalah blueprint final.
Tanpa arsitektur yang solid:
- Codebase akan berantakan seiring waktu
- Scaling akan painful
- Onboarding developer baru akan sulit
- Maintenance akan mahal

Dengan arsitektur yang tepat:
- Perubahan bisa dilakukan dengan percaya diri
- Tim bisa bekerja parallel
- Sistem bisa scale dengan baik
- Technical debt terkontrol
```

#### Architecture Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE OVERVIEW                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                        ┌─────────────────┐                          │
│                        │   CLIENTS       │                          │
│                        │   - Web (SPA)   │                          │
│                        │   - Mobile App  │                          │
│                        │   - Admin Panel │                          │
│                        └────────┬────────┘                          │
│                                 │                                    │
│                                 ▼                                    │
│                        ┌─────────────────┐                          │
│                        │   API GATEWAY   │                          │
│                        │   - Auth        │                          │
│                        │   - Rate Limit  │                          │
│                        │   - Routing     │                          │
│                        └────────┬────────┘                          │
│                                 │                                    │
│          ┌──────────────────────┼──────────────────────┐             │
│          │                      │                      │             │
│          ▼                      ▼                      ▼             │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐     │
│  │ PRODUCT       │      │ ORDER         │      │ USER          │     │
│  │ MODULE        │      │ MODULE        │      │ MODULE        │     │
│  │               │      │               │      │               │     │
│  │ - Products    │      │ - Cart        │      │ - Auth        │     │
│  │ - Categories  │      │ - Checkout    │      │ - Profile     │     │
│  │ - Search       │◄────►│ - Orders      │◄────►│ - Addresses   │     │
│  │ - Inventory    │      │ - Payments    │      │ - Wishlists   │     │
│  │ - Reviews      │      │ - Shipping    │      │ - Points      │     │
│  │ - Media        │      │ - Tracking    │      │ - Loyalty     │     │
│  └───────┬───────┘      └───────┬───────┘      └───────┬───────┘     │
│          │                      │                      │             │
│          └──────────────────────┼──────────────────────┘             │
│                                 │                                    │
│                                 ▼                                    │
│                        ┌─────────────────┐                          │
│                        │   DATA LAYER    │                          │
│                        │                 │                          │
│                        │ - PostgreSQL    │                          │
│                        │ - Redis Cache   │                          │
│                        │ - S3 Storage    │                          │
│                        │ - Search Index  │                          │
│                        └─────────────────┘                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Module Structure Template

```
┌─────────────────────────────────────────────────────────────────────┐
│ MODULE TEMPLATE: [Nama Modul]                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PURPOSE: [Apa yang dilakukan modul ini]                            │
│  DEPENDS ON: [Modul lain yang dibutuhkan]                          │
│  DEPENDED BY: [Modul lain yang butuh modul ini]                    │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  FRONTEND STRUCTURE:                                               │
│                                                                     │
│  src/
│  └── modules/
│      └── [module-name]/
│          ├── components/
│          │   ├── [ComponentName].tsx
│          │   └── [ComponentName].test.tsx
│          ├── hooks/
│          │   ├── use[Feature].ts
│          │   └── use[Feature]Data.ts
│          ├── services/
│          │   └── [module].service.ts
│          ├── types/
│          │   └── [module].types.ts
│          ├── utils/
│          │   └── [module].utils.ts
│          └── index.ts
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  BACKEND STRUCTURE:                                                │
│                                                                     │
│  backend/
│  └── modules/
│      └── [module-name]/
│          ├── [module-name].controller.ts
│          ├── [module-name].service.ts
│          ├── [module-name].repository.ts
│          ├── [module-name].types.ts
│          ├── [module-name].validations.ts
│          ├── [module-name].events.ts
│          └── __tests__/
│              └── [module-name].test.ts
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  API ENDPOINTS:                                                    │
│                                                                     │
│  ┌─────────────┬────────────────────────────────┬─────────────┐   │
│  │ METHOD      │ ENDPOINT                       │ DESCRIPTION │   │
│  ├─────────────┼────────────────────────────────┼─────────────┤   │
│  │ GET         │ /api/v1/[module]               │ List all    │   │
│  │ GET         │ /api/v1/[module]/:id           │ Get one     │   │
│  │ POST        │ /api/v1/[module]               │ Create      │   │
│  │ PUT         │ /api/v1/[module]/:id           │ Update      │   │
│  │ DELETE      │ /api/v1/[module]/:id           │ Delete      │   │
│  └─────────────┴────────────────────────────────┴─────────────┘   │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  DATABASE TABLES:                                                  │
│                                                                     │
│  - [table_1]                                                       │
│  - [table_2]                                                       │
│  - [table_3]                                                       │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  EVENTS:                                                           │
│                                                                     │
│  PUBLISHES:                                                        │
│  - [event.name]: [when triggered]                                  │
│                                                                     │
│  SUBSCRIBES:                                                       │
│  - [event.name]: [how handled]                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bagian 2: Proses Audit Sistematis

### Roadmap Audit Halaman

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE PAGE AUDIT CHECKLIST                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  HALAMAN: [Nama Halaman]                                            │
│  PRIORITAS: [1-5]                                                   │
│  TARGET: [Aplikasi yang diaudit]                                   │
│  ESTIMASI WAKTU: [ ] jam                                            │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  ✓ LAYER 1: UI COMPONENTS                                          │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Buat UI Component Checklist                         │      │
│    │ □ Identifikasi prioritas komponen                     │      │
│    │ □ Catat kondisi komponen (visible, hidden, dynamic)   │      │
│    │ □ Identifikasi komponen yang unik/istimewa            │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ✓ LAYER 2: UX ANALYSIS                                            │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Trace visual hierarchy (eye tracking simulation)      │      │
│    │ □ Identifikasi decision points                         │      │
│    │ □ Hitung click depth ke tujuan utama                  │      │
│    │ □ Identifikasi error states                           │      │
│    │ □ Identifikasi loading states                          │      │
│    │ □ Identifikasi empty states                            │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ✓ LAYER 3: BUSINESS FLOW                                          │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Diagram alur utama (happy path)                      │      │
│    │ □ Identifikasi semua branch/condition                  │      │
│    │ □ Identifikasi semua error paths                       │      │
│    │ □ Identifikasi semua side effects                      │      │
│    │ □ Identifikasi services yang terlibat                 │      │
│    │ □ Identifikasi events yang dipublish                  │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ✓ LAYER 4: STATE MANAGEMENT                                       │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Identifikasi server state yang dibutuhkan            │      │
│    │ □ Identifikasi client state yang dibutuhkan            │      │
│    │ □ Identifikasi URL state                              │      │
│    │ □ Identifikasi derived state                           │      │
│    │ □ Tentukan sync strategy untuk setiap state          │      │
│    │ □ Identifikasi state yang harus persist              │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ✓ LAYER 5: API ENDPOINTS                                           │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Capture network traffic (DevTools)                   │      │
│    │ □ List semua API endpoints yang dipanggil              │      │
│    │ □ Analisis request/response untuk setiap endpoint      │      │
│    │ □ Identifikasi aggregation patterns                    │      │
│    │ □ Identifikasi caching opportunities                   │      │
│    │ □ Draft response schemas                              │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ✓ LAYER 6: DATABASE                                               │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Identifikasi entitas yang terlihat                  │      │
│    │ □ Draft tabel-tabel yang dibutuhkan                     │      │
│    │ □ Identifikasi relationships                           │      │
│    │ □ Identifikasi indexes yang dibutuhkan                 │      │
│    │ □ Identifikasi query patterns                          │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ✓ LAYER 7: BUSINESS RULES                                         │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Identifikasi semua validasi                         │      │
│    │ □ Identifikasi semua perhitungan                       │      │
│    │ □ Identifikasi semua restrictions                      │      │
│    │ □ Identifikasi semua conditions                        │      │
│    │ □ Document setiap rule dengan examples                 │      │
│    │ □ Identifikasi edge cases                             │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ✓ LAYER 8: ARCHITECTURE                                           │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │ □ Identifikasi module yang dibutuhkan                 │      │
│    │ □ Identifikasi module yang harus dibuat               │      │
│    │ □ Identifikasi external integrations                   │      │
│    │ □ Draft module structure                              │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  OUTPUT:                                                           │
│  □ UI_Component_Checklist_[page].md                               │
│  □ UX_Analysis_[page].md                                           │
│  □ Business_Flow_[page].md                                         │
│  □ State_Management_[page].md                                      │
│  □ API_Map_[page].md                                               │
│  □ Database_Schema_[page].md                                       │
│  □ Business_Rules_[page].md                                        │
│  □ Architecture_[page].md                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Prioritas Audit: Phased Approach

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASED AUDIT ROADMAP                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 1: CORE COMMERCE (1-2 minggu)                                │
│  ══════════════════════════════════════════════════════════════   │
│                                                                     │
│  Week 1:                                                            │
│    Day 1-2: Homepage                                                │
│    Day 3-4: Search & Discovery                                      │
│    Day 5: Category/Navigation                                      │
│                                                                     │
│  Week 2:                                                            │
│    Day 1-2: Product Detail Page (PDP)                               │
│    Day 3-4: Cart & Wishlist                                         │
│    Day 5: Checkout Flow                                             │
│                                                                     │
│  PHASE 2: TRANSACTION (1 minggu)                                   │
│  ══════════════════════════════════════════════════════════════   │
│                                                                     │
│  Week 3:                                                            │
│    Day 1-2: Payment Flow                                            │
│    Day 3-4: Order Management                                        │
│    Day 5: Post-Purchase (Tracking, Cancellation)                    │
│                                                                     │
│  PHASE 3: ENGAGEMENT (1 minggu)                                     │
│  ══════════════════════════════════════════════════════════════   │
│                                                                     │
│  Week 4:                                                            │
│    Day 1-2: User Account & Profile                                 │
│    Day 3-4: Reviews & Ratings                                      │
│    Day 5: Notifications & Communication                            │
│                                                                     │
│  PHASE 4: SELLER/MERCHANT (2 minggu)                                │
│  ══════════════════════════════════════════════════════════════   │
│                                                                     │
│  Week 5-6: Seller Dashboard, Product Management, Order Management  │
│                                                                     │
│  PHASE 5: ADVANCED FEATURES (2 minggu)                             │
│  ══════════════════════════════════════════════════════════════   │
│                                                                     │
│  Week 7-8: Promotions, Analytics, Recommendations, Chat Support   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bagian 3: Templates Siap Pakai

### Template Dokumen Audit Lengkap

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│           ╔═══════════════════════════════════════════════════╗    │
│           ║           PAGE AUDIT DOCUMENT                     ║    │
│           ╚═══════════════════════════════════════════════════╝    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DOCUMENT INFO                                                      │
│  ─────────────────────────────────────────────────────────────────   │
│  Page Name: _________________________________________________        │
│  Application: ________________________________________________      │
│  Auditor: ____________________________________________________      │
│  Date: ________________________________________________________      │
│  Version: ___________________________________________________       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EXECUTIVE SUMMARY                                                  │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  [Tulis ringkasan 2-3 paragraf tentang apa yang ditemukan.         │
│   Fokus pada insight utama, bukan detail.]                         │
│                                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. UI COMPONENT AUDIT                                              │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  [Sisipkan UI Component Checklist dari Bagian 1, Layer 1]          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  2. UX ANALYSIS                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  Visual Hierarchy:                                                  │
│  [Urutan pandang pengguna]                                          │
│                                                                     │
│  Click Depth:                                                       │
│  [Berapa klik untuk mencapai tujuan utama]                          │
│                                                                     │
│  Decision Points:                                                   │
│  [Pilihan yang harus dibuat pengguna]                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  3. BUSINESS FLOW                                                   │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  [Sisipkan Business Flow Diagram dari Bagian 1, Layer 3]            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  4. STATE MANAGEMENT                                                │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  Server State Required:                                             │
│  - ___________________________________________________________     │
│  - ___________________________________________________________     │
│                                                                     │
│  Client State Required:                                             │
│  - ___________________________________________________________     │
│  - ___________________________________________________________     │
│                                                                     │
│  URL State:                                                         │
│  - ___________________________________________________________     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  5. API ENDPOINTS                                                   │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  [Sisipkan API Map dari Bagian 1, Layer 5]                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  6. DATABASE SCHEMA                                                │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  [Sisipkan Database Schema Draft dari Bagian 1, Layer 6]           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  7. BUSINESS RULES                                                  │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  [Sisipkan Business Rules Specification dari Bagian 1, Layer 7]   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  8. ARCHITECTURE IMPLICATIONS                                       │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  Module Required:                                                   │
│  ____________________________________________________________      │
│                                                                     │
│  Dependencies:                                                       │
│  ____________________________________________________________      │
│                                                                     │
│  External Integrations:                                             │
│  ____________________________________________________________      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  IMPLEMENTATION PRIORITY                                            │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  ☐ Critical (Must have for MVP)                                    │
│  ☐ Important (Should have)                                         │
│  ☐ Nice to have (Can defer)                                        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  RISKS & NOTES                                                      │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  [Catat risiko, asumsi, atau hal yang perlu didiskusikan]          │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Comparison Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│ FEATURE COMPARISON MATRIX                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Aplikasi yang dibandingkan:                                        │
│  1. _______________                                                  │
│  2. _______________                                                  │
│  3. _______________                                                  │
│  4. [Nama Aplikasi Kita]                                           │
│                                                                     │
│  ════════════════════════════════════════════════════════════════  │
│                                                                     │
│  ┌────────────────┬─────────┬─────────┬─────────┬─────────┐       │
│  │ Feature        │ App 1   │ App 2   │ App 3   │ Kita    │       │
│  ├────────────────┼─────────┼─────────┼─────────┼─────────┤       │
│  │                │         │         │         │         │       │
│  │ WISHLIST       │         │         │         │         │       │
│  │  - Add to wish │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - Share wish  │    ✅   │    ❌   │    ✅   │   ☐    │       │
│  │  - Move to cart│    ✅   │    ✅   │    ❌   │   ☐    │       │
│  │                │         │         │         │         │       │
│  │ REVIEWS        │         │         │         │         │       │
│  │  - Star rating │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - Text review │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - Photo review│    ✅   │    ✅   │    ❌   │   ☐    │       │
│  │  - Video review│    ✅   │    ❌   │    ❌   │   ☐    │       │
│  │  - Seller resp │    ✅   │    ❌   │    ✅   │   ☐    │       │
│  │                │         │         │         │         │       │
│  │ SEARCH         │         │         │         │         │       │
│  │  - Text search │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - Voice search│    ✅   │    ❌   │    ✅   │   ☐    │       │
│  │  - Image search│    ✅   │    ✅   │    ❌   │   ☐    │       │
│  │  - Filters     │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - Sort        │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │                │         │         │         │         │       │
│  │ CHECKOUT       │         │         │         │         │       │
│  │  - Guest check │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - Multiple addr│   ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - Saved cards │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - COD         │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - E-wallet    │    ✅   │    ✅   │    ✅   │   ☐    │       │
│  │  - QR pay      │    ❌   │    ✅   │    ✅   │   ☐    │       │
│  │                │         │         │         │         │       │
│  └────────────────┴─────────┴─────────┴─────────┴─────────┘       │
│                                                                     │
│  LEGEND:                                                            │
│  ✅ = Feature ada dan berfungsi                                    │
│  ❌ = Feature tidak ada                                            │
│  ☐ = Kita belum punya fitur ini (GAP)                               │
│  ⚠️  = Kita punya tapi berbeda implementasinya                      │
│                                                                     │
│  ════════════════════════════════════════════════════════════════  │
│                                                                     │
│  GAP ANALYSIS:                                                      │
│                                                                     │
│  Critical Gaps (Must address):                                      │
│  - ____________________________________________________________   │
│  - ____________________________________________________________   │
│                                                                     │
│  Important Gaps (Should address):                                 │
│  - ____________________________________________________________   │
│  - ____________________________________________________________   │
│                                                                     │
│  Nice-to-have Gaps (Can defer):                                    │
│  - ____________________________________________________________   │
│  - ____________________________________________________________   │
│                                                                     │
│  Differentiation Opportunities (What we can do better):            │
│  - ____________________________________________________________   │
│  - ____________________________________________________________   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bagian 4: Best Practices

### Prinsip-Prinsip Audit

```
┌─────────────────────────────────────────────────────────────────────┐
│                    10 COMMANDMENTS OF RE AUDIT                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. THOU SHALT NOT COPY, ONLY LEARN                                  │
│     Understand the WHY, not just the WHAT.                          │
│                                                                     │
│  2. THOU SHALT DOCUMENT EVERYTHING                                  │
│     If it's not written down, it doesn't exist.                     │
│                                                                     │
│  3. THOU SHALT USE MULTIPLE SOURCES                                 │
│     Never rely on one app. Compare 3-5 apps per feature.          │
│                                                                     │
│  4. THOU SHALT ACT AS A USER                                        │
│     Use the app. Don't just read about it.                         │
│                                                                     │
│  5. THOU SHALT GO DEEP ON CRITICAL FEATURES                         │
│     For core commerce flows, trace every single step.               │
│                                                                     │
│  6. THOU SHALT BE SUSPICIOUS OF "SIMPLE" FEATURES                   │
│     Behind every "simple" feature, there's complexity.              │
│                                                                     │
│  7. THOU SHALT IDENTIFY THE EDGE CASES                              │
│     The quality of a system shows in edge cases.                   │
│                                                                     │
│  8. THOU SHALT THINK IN LAYERS                                      │
│     UI → UX → Flow → State → API → Data → Rules → Architecture    │
│                                                                     │
│  9. THOU SHALT PRIORITIZE ruthlessly                                │
│     Not everything needs to be built. Not everything needs         │
│     to be built NOW.                                               │
│                                                                     │
│  10. THOU SHALT ITERATE                                             │
│     First audit is rough. That's fine. Iterate and refine.          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Common Pitfalls

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMMON AUDIT PITFALLS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PITFALL 1: Shallow Observation                                     │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Hanya mencatat apa yang terlihat di permukaan          │
│  ✅ Solution: Trace setiap flow sampai selesai                     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  PITFALL 2: Copy-Paste Mentality                                    │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Ingin membuat fitur yang SAMA PERSIS dengan target    │
│  ✅ Solution: Identifikasi kebutuhan inti, bukan implementasi     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  PITFALL 3: Analysis Paralysis                                      │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Terlalu banyak menganalisis, kurang action              │
│  ✅ Solution: Gunakan time-boxing. 2 jam per halaman maksimum      │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  PITFALL 4: Missing Business Rules                                  │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Hanya mendokumentasikan UI, lupa logika bisnis        │
│  ✅ Solution: Selalu tanya "KENAPA?" untuk setiap behavior          │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  PITFALL 5: Ignoring Edge Cases                                     │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Hanya dokumentasi happy path                           │
│  ✅ Solution: Selalu trace error paths dan boundary conditions     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  PITFALL 6: Scope Creep                                             │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Ingin mengaudit SEMUA aplikasi sekaligus               │
│  ✅ Solution: Phase-based approach. Focus pada prioritas.           │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  PITFALL 7: No Comparison                                           │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Hanya mengaudit SATU aplikasi target                   │
│  ✅ Solution: Bandingkan 3-5 aplikasi untuk perspektif lebih luas  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                     │
│  PITFALL 8: Forgetting User Perspective                            │
│  ─────────────────────────────────────────────────────────────────   │
│  ❌ Problem: Terlalu fokus pada teknis, lupa experience pengguna    │
│  ✅ Solution: Selalu jawab "Bagaimana ini dirasakan pengguna?"     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Quality Checklist Sebelum Menyelesaikan Audit

```
┌─────────────────────────────────────────────────────────────────────┐
│ AUDIT COMPLETION CHECKLIST                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Sebelum menganggap audit halaman selesai:                          │
│                                                                     │
│  □ Apakah saya sudah BECOME USER untuk halaman ini?                │
│     - Sudah login dan logout                                       │
│     - Sudah coba edge cases                                        │
│     - Sudah rasakan UX secara langsung                             │
│                                                                     │
│  □ Apakah saya sudah trace SEMUA flows?                            │
│     - Happy path utama                                            │
│     - Alternative paths                                            │
│     - Error paths                                                  │
│     - Recovery paths                                               │
│                                                                     │
│  □ Apakah saya sudah menjawab SEMUA 8 layer?                       │
│     - Layer 1: UI Components (semua komponen teridentifikasi?)    │
│     - Layer 2: UX (visual hierarchy jelas?)                        │
│     - Layer 3: Business Flow (diagram lengkap?)                   │
│     - Layer 4: State Management (semua state teridentifikasi?)     │
│     - Layer 5: API (semua endpoint ter-capture?)                   │
│     - Layer 6: Database (schema draft ada?)                        │
│     - Layer 7: Business Rules (semua rules terdokumentasi?)       │
│     - Layer 8: Architecture (module implication jelas?)            │
│                                                                     │
│  □ Apakah dokumentasi saya BISA DIMENGERTI ORANG LAIN?             │
│     - Apakah cukup jelas untuk di-share ke tim?                   │
│     - Apakah ada cukup context untuk implementasi?                │
│     - Apakah ada contoh konkret?                                   │
│                                                                     │
│  □ Apakah saya sudah IDENTIFY GAP dengan aplikasi kita?            │
│     - Fitur apa yang belum kita punya?                             │
│     - Fitur apa yang kita butuhkan sekarang?                      │
│     - Prioritas apa yang harus kita ambil?                         │
│                                                                     │
│  □ Apakah saya sudah SIMPAN dengan FORMAT YANG KONSISTEN?          │
│     - Semua dokumen menggunakan template yang sama?                │
│     - Penamaan file konsisten?                                     │
│     - Folder organization jelas?                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bagian 5: Appendices

### Appendix A: Glossary

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GLOSSARY                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  AGGREGATION                                                        │
│  Menggabungkan data dari multiple sources ke single response.       │
│                                                                     │
│  BFF (Backend for Frontend)                                         │
│  API layer yang dibuat khusus untuk satu type client.               │
│                                                                     │
│  BUSINESS FLOW                                                      │
│  Urutan proses yang menggambarkan bagaimana business berjalan.      │
│                                                                     │
│  CLICK DEPTH                                                        │
│  Jumlah klik yang dibutuhkan untuk mencapai tujuan tertentu.         │
│                                                                     │
│  CURSOR-BASED PAGINATION                                            │
│  Pagination menggunakan pointer/ID, bukan offset.                   │
│                                                                     │
│  EDGE CASE                                                           │
│  Kondisi atau situasi yang jarang terjadi tapi harus ditangani.      │
│                                                                     │
│  HAPPY PATH                                                         │
│  Alur utama dimana semuanya berjalan sesuai rencana.               │
│                                                                     │
│  LAYER (dalam konteks playbook ini)                                │
│  Tingkat/abstraksi analisis. 8 layer = 8 tingkat kedalaman.         │
│                                                                     │
│  OFFSET-BASED PAGINATION                                            │
│  Pagination menggunakan nomor halaman/baris.                        │
│                                                                     │
│  REVERSE ENGINEERING (dalam konteks ini)                           │
│  Mempelajari perilaku aplikasi untuk men derives requirement.        │
│  BUKAN menyalin kode atau implementasi.                             │
│                                                                     │
│  SIDE EFFECT                                                        │
│  Aksi yang terjadi di luar alur utama.                              │
│                                                                     │
│  STACKING RULES                                                     │
│  Aturan apakah diskon/promo bisa digabungkan.                       │
│                                                                     │
│  STATE MANAGEMENT                                                   │
│  Bagaimana aplikasi menyimpan dan mengelola data.                   │
│                                                                     │
│  SYNC STRATEGY                                                      │
│  Bagaimana data di-sync antara client dan server.                   │
│                                                                     │
│  USER JOURNEY                                                        │
│  Langkah-langkah yang diambil user dari awal hingga akhir.          │
│                                                                     │
│  VISUAL HIERARCHY                                                   │
│  Urutan prioritas visual yang menuntun mata pengguna.               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Appendix B: Tools Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOOLS REFERENCE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BROWSER DEVTOOLS                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Use: Network analysis, Performance profiling, Debugging      │   │
│  │ Shortcut: F12 or Ctrl+Shift+I                               │   │
│  │ Key Tabs: Elements, Console, Network, Application           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CHARLES PROXY / PROXYMAN                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Use: HTTPS interception, Mobile traffic capture              │   │
│  │ Platform: macOS, Windows, iOS, Android                      │   │
│  │ Alternative: mitmproxy (open source)                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NOTION / OBSIDIAN                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Use: Documentation, Linking notes, Knowledge management      │   │
│  │ Obsidian: Free, local, graph view                           │   │
│  │ Notion: Cloud, collaborative, templates                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DIAGRAM (MERMAP, EXCALIDRAW, DRAW.IO)                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Use: Flow diagrams, Architecture diagrams, Mind maps        │   │
│  │ Excalidraw: Free, hand-drawn style                         │   │
│  │ Draw.io: Free, professional, many templates                 │   │
│  │ Mermaid: Code-based, git-friendly                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SCREEN RECORDING                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Use: Capture user flows, Record edge cases                  │   │
│  │ OBS: Free, cross-platform                                  │   │
│  │ Loom: Cloud, easy sharing                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Appendix C: Suggested Reading

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SUGGESTED READING                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DESIGN & UX                                                        │
│  - "Don't Make Me Think" by Steve Krug                              │
│  - "The Design of Everyday Things" by Don Norman                    │
│  - "Hooked: How to Build Habit-Forming Products" by Nir Eyal        │
│                                                                     │
│  PRODUCT & STRATEGY                                                 │
│  - "Inspired: How to Create Tech Products" by Marty Cagan            │
│  - "The Lean Product Playbook" by Dan Olsen                          │
│  - "Escaping the Build Trap" by Melissa Perri                      │
│                                                                     │
│  ARCHITECTURE                                                       │
│  - "Designing Data-Intensive Applications" by Martin Kleppmann       │
│  - "System Design Interview" by Alex Xu                             │
│  - "Fundamentals of Software Architecture" by Mark Richards         │
│                                                                     │
│  E-COMMERCE SPECIFIC                                                │
│  - "E-commerce Analytics" by Humble & Frazzette                      │
│  - Industry reports dari McKinsey, Bain, Gartner                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Penutup

### Ringkasan Playbook

Dokumen ini telah mencakup:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    YANG TELAH DICOVER DALAM PLAYBOOK INI           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PHILOSOPHY                                                      │
│     - Reverse engineering adalah BELAJAR, bukan MENIRU              │
│     - 8 layer untuk analisis sistematis                              │
│     - Mindset yang harus dimiliki                                  │
│                                                                     │
│  2. 8-LAYER FRAMEWORK                                               │
│     Layer 1: Visual UI - Komponen apa yang ada                       │
│     Layer 2: UX - Bagaimana pengguna merasakan                     │
│     Layer 3: Business Flow - Apa yang terjadi di balik layar        │
│     Layer 4: State Management - Data apa yang diingat                │
│     Layer 5: API - Bagaimana frontend komunikasi dengan backend     │
│     Layer 6: Database - Bagaimana data disimpan                     │
│     Layer 7: Business Rules - Logika dan aturan yang mendasari      │
│     Layer 8: Architecture - Bagaimana semuanya terhubung            │
│                                                                     │
│  3. TEMPLATES & FORMATS                                             │
│     - UI Component Checklist                                        │
│     - UX Flow Map                                                   │
│     - Business Flow Diagram                                         │
│     - State Audit Template                                          │
│     - API Map Template                                              │
│     - Database Schema Draft                                         │
│     - Business Rules Specification                                  │
│     - Feature Comparison Matrix                                     │
│                                                                     │
│  4. PROCESS                                                         │
│     - Roadmap audit halaman                                         │
│     - Prioritas dengan phased approach                              │
│     - Quality checklist sebelum selesai                            │
│                                                                     │
│  5. BEST PRACTICES                                                  │
│     - 10 Commandments of Reverse Engineering                       │
│     - Common pitfalls dan cara menghindarinya                        │
│     - Quality checklist                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Langkah Selanjutnya

Setelah memahami playbook ini, yang perlu dilakukan adalah:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LANGKAH SELANJUTNYA                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PRAKTEK: Pilih satu halaman sederhana                          │
│     Audit halaman login dari 3 aplikasi berbeda.                    │
│                                                                     │
│  2. TEMPLATE: Buat semua template dalam dokumen ini                │
│     Gunakan tools favorit (Notion, Obsidian, dll)                  │
│                                                                     │
│  3. PILIH TARGET: Tentukan aplikasi yang akan di-audit              │
│     Rekomendasi: Audit kompetitor terdekat                          │
│                                                                     │
│  4. MULAI AUDIT: Ikuti roadmap dan prioritas                       │
│     Phase 1: Core commerce flows                                    │
│                                                                     │
│  5. VALIDASI: Bagikan hasil ke tim                                 │
│     Apakah dokumentasi bisa dipahami? Apakah berguna untuk         │
│     implementasi?                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

*Playbook ini adalah living document. Update sesuai kebutuhan dan temuan baru.*
