# A. Phase 0

0. Initial folder
   Buat folder utama untuk proyek e-commerce Anda
   mkdir mega-ecommerce
   cd mega-ecommerce

   Buat folder khusus untuk backend
   mkdir backend
   cd backend

   Inisialisasi proyek Node.js baru (akan menghasilkan file package.json)
   npm init -y

1. Instalasi Dependencies Utama & TypeScript
   Instal Express sebagai framework utama
   npm install express dotenv

   Instal TypeScript dan Tools Development sebagai Dev Dependencies
   npm install -D
   typescript
   @types/node
   @types/express
   tsx
   eslint
   prettier
   eslint-config-prettier

2. Konfigurasi TypeScript (tsconfig.json)
   npx tsc --init

   Perintah ini akan menghasilkan file tsconfig.json. Ubah atau pastikan beberapa konfigurasi penting berikut aktif di dalamnya:

   ```JSON (contoh)
   {
   "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./",         // <-- Diubah ke root backend
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
   },
   "include": ["**/*.ts"],    // <-- Memastikan semua file .ts dicakup
   "exclude": ["node_modules", "dist"]
   }
   ```

3. Konfigurasi Script di package.json
   Buka file package.json Anda, lalu tambahkan script untuk menjalankan aplikasi dalam mode development dan production build:

   ```JSON
   "scripts": {
   "dev": "tsx watch app.ts",
   "build": "tsc",
   "start": "node dist/app.js"
   }
   ```

4. Membuat Struktur Folder Awal & File .env
   Sesuaikan struktur folder awal Anda di dalam direktori backend/ agar rapi:

   ```Plaintext
   backend/
   ├── modules/
   │ ├── auth/
   │ │ ├── controller.ts # HTTP only
   │ │ ├── service.ts # Business logic
   │ │ ├── repository.ts # DB only
   │ │ ├── schema.ts # Validation
   │ │ └── routes.ts
   │ ├── user/
   │ ├── product/
   │ ├── cart/
   │ ├── order/
   │ ├── payment/
   │ └── inventory/
   ├── shared/
   │ ├── errors/
   │ ├── logger/
   │ ├── validation/
   │ ├── middleware/
   │ └── config/
   ├── infra/
   │ ├── db/
   │ ├── cache/
   │ ├── queue/
   │ └── storage/
   └── app.ts
   ```

   catatan: repository tetap ini, karena nanti order/payment gampang bocor.

   ```Plaintext
   Repository
   ↓
   raw persistence

   Service
   ↓
   business
   ```

   Isi file .env dasar:

   ```Cuplikan kode
       PORT=3000
       NODE_ENV=development
   ```

5. Buat file .gitignore di global scope:

   ```Plaintext
    # Dependency folder
    node_modules

    # Production build

    dist
    .next/
    out/

    # Environment variables

    .env
    .env.local
    .env.\*.local

    # Logs

    npm-debug.log*
    yarn-debug.log*
    yarn-error.log\*
   ```

6. Mengisi backend/app.ts
   Mari kita pindahkan kode server uji coba kita ke tempat yang seharusnya, yaitu backend/app.ts:

   ```TypeScript
   import express, { Request, Response } from 'express';
   import dotenv from 'dotenv';

   dotenv.config();

   const app = express();
   const port = process.env.PORT || 3000;

   app.use(express.json());

   // Base Health Check Route (Sesuai Phase 1 rencana kita nanti)
   app.get('/health', (req: Request, res: Response) => {
   res.status(200).json({
   status: 'UP',
   message: 'Pasaria E-Commerce API is running on Modular Monolith architecture'
   });
   });

   app.listen(port, () => {
   console.log(`⚡️ [server]: Server Pasaria berjalan di http://localhost:${port}`);
   });
   ```

# B. Phase 0.5

- siapa objeknya ?
- siapa boleh melakukan apa ?
- data apa yang disimpan ?
- urutan kejadian ?
- dan apa batasannya?

Buat folder:

docs/
├── domains.md
├── api_contract.md
├── db_model.md
├── events.md
└── non_functional.md

1. domain.md
   Tujuan: menentukan objek bisnis dan relasi

   User
   ↓
   Cart
   ↓
   Order
   ↓
   Payment

   Product
   ↓
   Inventory

2. events.md
   Tujuan: mendefinisikan apa yang ada di sistem.

   contoh:
   | Event | Producer | Consumer |
   | ---------------- | -------- | --------- |
   | OrderPlaced | Order | Inventory |
   | PaymentCompleted | Payment | Order |

3. db_model.md
   Tujuan: translate domain -> domain
   Jangan langsung prisma, tapi mulai lah dari ERD tekstual. dan jangan buat tabel review dulu kalo belum dipakai
   | Event | Producer | Consumer |
   | ---------------- | -------- | --------- |
   | OrderPlaced | Order | Inventory |
   | PaymentCompleted | Payment | Order |

4. api_contract.md
   Tujuan: bentuk komunikasi frontend <-> backend
