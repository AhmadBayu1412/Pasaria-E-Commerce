# PHASE 1 — FOUNDATION

Target Phase 1:

```Shell
backend/
├── infra/
│ ├── db/
│ │ ├── prisma.ts
│ │ └── health.ts
│ ├── cache/
│ │ └── redis.ts
│ └── queue/
├── shared/
│ ├── config/
│ ├── logger/
│ ├── middleware/
│ └── errors/
├── app.ts
```

Urutan implementasi:
STEP 1 → Prisma setup
STEP 2 → PostgreSQL connect
STEP 3 → Redis connect
STEP 4 → Config loader
STEP 5 → Pino logger
STEP 6 → Error middleware
STEP 7 → Health check
STEP 8 → Smoke test

Selesai Phase 1 kalau endpoint ini hidup:
GET /health

Response:

```JSON
{
"status":"UP",
"database":"UP",
"redis":"UP"
}
```

---

## STEP 1

#### Prisma Setup + Database Bootstrap

Ada beberapa bagian yang sekarang sudah tidak sesuai lagi dengan setup Pasaria.

- kamu ternyata memakai **Prisma generator baru (`provider = "prisma-client"`)**
- output client sudah dipindah ke **`generated/prisma/`**
- Prisma sekarang perlu **adapter PostgreSQL**
- bootstrap server sekarang lebih aman jika **DB connect dulu → baru listen**
- health endpoint ternyata lebih cocok di `app.ts` dulu (belum `infra/db/health.ts`)
- root `/` memang tidak wajib (cukup `/health`)

**Tujuan Step 1**
Target akhir:

```txt
backend/
├── generated/
│   └── prisma/
│
├── prisma/
│   └── schema.prisma
│
├── infra/
│   └── db/
│       └── prisma.ts
│
├── app.ts
├── prisma.config.ts
└── .env
```

Selesai jika:

```txt
GET /health
```

mengembalikan:

```json
{
  "status": "UP"
}
```

dan terminal:

```txt
DB CONNECTED
Server berjalan
```

---

#### A. Install Prisma

Install:

```bash
npm install prisma
npm install @prisma/client
npm install @prisma/adapter-pg pg
```

Cek:

```bash
npx prisma -v
```

Harus muncul:

```txt
Prisma CLI
@prisma/client
```

---

#### B. Init Prisma

Jalankan:

```bash
npx prisma init
```

Hasil:

```txt
backend/
├── prisma/
│   └── schema.prisma
└── .env
```

Catatan: ✅ biarkan lokasi default
Jangan pindahkan `schema.prisma`.

---

#### C. Setup DATABASE_URL

Isi `.env`

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pasaria"
```

Format:

```txt
postgresql://user:password@host:port/database
```

Cek PostgreSQL:

```bash
psql --version
```

---

#### D. Edit schema.prisma

Buka:

```txt
prisma/schema.prisma
```

Gunakan:

```prisma
generator client {
 provider = "prisma-client"
 output = "../generated/prisma"
}
datasource db {
 provider = "postgresql"
 url = env("DATABASE_URL")
}
```

Catatan:
Sekarang Pasaria memakai:

```txt
prisma-client
```

bukan:

```txt
prisma-client-js
```

karena kita ingin generated client terpisah.

---

#### E. Generate Prisma Client

Generate:

```bash
npx prisma generate
```

Hasil:

```txt
generated/
└── prisma/
    ├── client.ts
    ├── browser.ts
    ├── models.ts
```

Kalau sukses:

```txt
✔ Generated Prisma Client
```

---

#### F. Buat Adapter Prisma

Buat:

```txt
infra/db/prisma.ts
```

Isi:

```ts
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

Kenapa begini?
Karena generator baru Prisma membutuhkan:

```ts
new PrismaClient({
  adapter,
});
```

---

#### G. Bootstrap App

`app.ts`

```ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { prisma } from './infra/db/prisma';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
  });
});

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('DB CONNECTED');

    app.listen(port, () => {
      console.log(`⚡ Server berjalan di http://localhost:${port}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

bootstrap();
```

Catatan:
Urutan penting:

```txt
dotenv
↓
prisma connect
↓
listen
```

---

#### H. Verifikasi

Jalankan:

```bash
npm run dev
```

Terminal:

```txt
DB CONNECTED
⚡ Server berjalan
```

Buka:

```txt
http://localhost:3000/health
```

Bukan:

```txt
/
```

Response:

```json
{
  "status": "UP"
}
```

---

#### I. Troubleshooting

##### Error

```txt
Cannot find module generated/prisma
```

Solusi:

```ts
import { PrismaClient } from '../../generated/prisma/client.js';
```

---

#### Error

```txt
PrismaClientInitializationError
```

Solusi:
Install:

```bash
npm install @prisma/adapter-pg pg
```

dan gunakan:

```ts
adapter:
new PrismaPg(...)
```

---

#### Checklist selesai STEP 1

```txt
□ prisma install
□ adapter install
□ prisma init
□ schema.prisma siap
□ DATABASE_URL aktif
□ prisma generate
□ prisma connect
□ bootstrap sukses
□ GET /health hidup
```

---

## STEP 2 PostgreSQL connect

Tujuan:

> membuktikan database benar-benar bisa dipakai untuk operasi nyata.

Yang dibuktikan:

```txt
app
↓
route
↓
query
↓
database
↓
response
```

Bukan cuma connect.

---

#### Output akhir STEP 2

Target endpoint:

```txt
GET /health/db
```

Response sukses:

```json
{
  "database": "UP"
}
```

Kalau gagal:

```json
{
  "database": "DOWN"
}
```

Kalau ini berhasil: ✅ PostgreSQL connect selesai.

---

#### A. Buat file health checker

Buat:

```txt
infra/
└── db/
    └── health.ts
```

Isi:

```ts
import { prisma } from "./prisma";

export async function checkDatabaseHealth() {
    try {
        // Melakukan kueri universal yang sangat ringan
        await prisma.$queryRaw`SELECT 1`;

        return {
            database: "UP",
            error: null
        };
    } catch (error: any) {
        // KOREKSI: Wajib mencatat error ke terminal untuk kebutuhan debugging
        console.error("[HEALTH CHECK FAILED]: Database is unreachable.",
        error?.message || error);

        return {
            database: "DOWN",
	            // Opsional: jangan lempar detail error ke client demi keamanan,
	            cukup simpan di log
        };
    }
}
```

---

#### Kenapa pakai `$queryRaw`

Karena kita belum punya model.
Kalau pakai:

```ts
prisma.user.findMany();
```

kamu harus sudah punya:

```prisma
model User
```

sedangkan sekarang belum.
`SELECT 1`

artinya:

```sql
DB, jawab kalau kamu hidup
```

ringan dan universal.

---

#### B. Hubungkan ke app.ts

Cari:

```ts
app.get("/health", ...)
```

Tambah:

```ts
import { checkDatabaseHealth } from './infra/db/health';
```

lalu:

```ts
// ... konfigurasi app lainnya ...
```

lalu:

```ts
app.get('/health/db', async (_, res) => {
  const result = await checkDatabaseHealth();

  // 200 OK jika siap, 503 Service Unavailable jika bermasalah
  res.status(result.database === 'UP' ? 200 : 503);
  res.json(result);
});
```

---

#### C. Jalankan

```bash
npm run dev
```

---

#### D. Test endpoint

Buka:

```txt
http://localhost:3000/health/db
```

---

Kalau sukses:

```json
{
  "database": "UP"
}
```

Terminal:

```txt
DB CONNECTED
```

---

#### E. Uji gagal (penting)

Sekarang sengaja matikan PostgreSQL.

Lalu refresh:

```txt
/health/db
```

Harus jadi:

```json
{
  "database": "DOWN"
}
```

Kalau ini berhasil berarti sistem deteksi hidup.

---

#### Struktur setelah STEP 2

Target:

```txt
backend/
├── infra/
│   └── db/
│       ├── prisma.ts
│       └── health.ts
│
├── app.ts
├── prisma/
└── generated/
```

---

#### Kenapa ini penting sebelum Redis?

Karena nanti STEP 7:

```txt
GET /health
```

akan jadi gabungan:

```json
{
  "status": "UP",
  "database": "UP",
  "redis": "UP"
}
```

Dan `database` nanti mengambil dari:

```ts
checkDatabaseHealth();
```

yang kamu buat sekarang.

---

#### Checklist STEP 2

```txt
□ buat infra/db/health.ts
□ query SELECT 1 berhasil
□ GET /health/db hidup
□ status 200 jika UP
□ status 503 jika DOWN
□ test DB dimatikan
```
