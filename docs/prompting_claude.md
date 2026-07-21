# Claude Prompting Bug

## Version 1

#### Naive Prompt

```
Fix this bug.
The fees on the checkout page are different from those on the orders page.
Here is the code.
```

#### Output (Claude)

````
Found it. The bug isn't in your math — it's in your data source.

## Root cause

In `backend/modules/checkout/checkout.service.ts`, the shipping and payment fee data is **hardcoded a second time**:

```ts
// ----- Shipping Options (mirrored from shipping.controller.ts) -----
const SHIPPING_OPTIONS = [...]

// ----- Payment Methods (mirrored from payment-methods.controller.ts) -----
const PAYMENT_METHODS = [...]
````

The comments literally admit it: these are manual copies of the lists that live in `shipping.controller.ts` and `payment-methods.controller.ts`.

That split is exactly what's causing your bug:

- The **checkout page** calls `GET /shipping-options` and `GET /payment-methods` → these are served by the _controllers_ → their live data.
- When the user clicks "place order," `completeCheckout()` computes `shippingFee`/`adminFee` from the **local mirrored arrays** in `checkout.service.ts`, not the controllers.
- Whoever last updated a price (e.g. bumped GrabExpress or added a new bank VA) only edited one of the two copies. Now the number the customer sees at checkout and the number actually saved to the order (and shown later on the orders page) can permanently disagree — with zero errors thrown, since both arrays are individually "valid."

This is a classic dual-source-of-truth bug: nothing will ever force these two lists to stay in sync.

## Fix

Extract one canonical source and have everything read from it.

**New file: `backend/shared/constants/checkout-options.ts`**

```ts
export interface ShippingOptionDef {
  id: string;
  name: string;
  price: number;
}
export interface PaymentMethodDef {
  id: string;
  name: string;
  fee: number;
}

export const SHIPPING_OPTIONS: ShippingOptionDef[] = [
  { id: 'jne_reg', name: 'JNE Regular', price: 15000 },
  { id: 'jne_yes', name: 'JNE YES', price: 35000 },
  { id: 'pos_kilat', name: 'Pos Kilat', price: 20000 },
  { id: 'tiki_reg', name: 'TIKI Regular', price: 18000 },
  { id: 'grab_express', name: 'GrabExpress', price: 25000 },
];

export const PAYMENT_METHODS: PaymentMethodDef[] = [
  { id: 'bca_va', name: 'BCA Virtual Account', fee: 4000 },
  { id: 'mandiri_va', name: 'Mandiri Virtual Account', fee: 4000 },
  { id: 'bni_va', name: 'BNI Virtual Account', fee: 4000 },
  { id: 'bri_va', name: 'BRI Virtual Account', fee: 4000 },
  { id: 'gopay', name: 'GoPay', fee: 2000 },
  { id: 'ovo', name: 'OVO', fee: 2000 },
  { id: 'dana', name: 'DANA', fee: 2000 },
  { id: 'credit_card', name: 'Kartu Kredit', fee: 2.9 }, // still needs the % fix below
  { id: 'indomaret', name: 'Indomaret', fee: 2500 },
  { id: 'alfamart', name: 'Alfamart', fee: 2500 },
  { id: 'qris', name: 'QRIS', fee: 0 },
];
```

**`checkout.service.ts`** — delete the two local arrays and import instead:

```ts
import {
  SHIPPING_OPTIONS,
  PAYMENT_METHODS,
} from '../../shared/constants/checkout-options.js';
```

Everything else in the file (`getShippingOption`, `getPaymentMethod`, `completeCheckout`) stays the same.

**`shipping.controller.ts`** and **`payment-methods.controller.ts`** — replace their own hardcoded lists with the same import, so the `GET` endpoints the checkout page reads from return the exact same objects that `checkout.service.ts` charges from. (I don't have those two files in what you pasted — send them over and I'll patch them directly.)

With one array feeding both the display and the charge, this class of bug becomes structurally impossible instead of something you have to remember to keep in sync.

## One more thing while I'm in here

Separate from the sync bug: `credit_card` has `fee: 2.9` with a `// percentage-based` comment, but nowhere — not in `checkout.service.ts`, not in the frontend — is it ever actually computed as 2.9% of the subtotal. It's added as a flat Rp 2.9 (rounds to Rp 3) everywhere it's used. It won't cause a checkout-vs-orders mismatch (both sides are wrong the same way), but it means credit card checkouts are effectively fee-free, which probably isn't intended. If you want, I can add a `feeType: 'flat' | 'percentage'` field to `PaymentMethodDef` and fix the calculation on both ends — just say the word.

```

## Version 2

#### Role Prompting

```

Now, I'd like to correct the previous question.
Add Role Assignments
Assume you're a Senior Frontend Engineer.

Answer again.

```

#### Output (Claude)

```

Got it — switching hats to Senior Frontend Engineer, staying entirely inside `frontend/`.

## Root cause (frontend-only)

`cartService.initiateCheckout()` already exists and does exactly what's needed — it hits `POST /checkout` and gets back the **authoritative subtotal**, computed server-side from live product prices at that moment.

```ts
async initiateCheckout(): Promise<CheckoutPreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/checkout`, { method: 'POST', ... })
  ...
  preview: { subtotal: data.data.summary?.subtotal || 0, ... }
}
```

But `checkout-preview.tsx` **never calls it**. Instead, the whole page is driven by:

```ts
const subtotal = useCartSubtotal(); // sums item.price * item.quantity from the LOCAL Zustand store
```

And that store is `persist`-ed to `localStorage`:

```ts
{ name: 'pasaria-cart', storage: createJSONStorage(() => localStorage), ... }
```

So `item.price` is whatever price was cached in the browser when the item was added — which can be hours, days, or weeks stale. The checkout page's subtotal, and therefore its `total` (subtotal + shipping + payment fee), is built entirely from that stale, client-side number.

Meanwhile, when the order is actually placed, the backend ignores whatever the frontend sent and recomputes `subtotal` fresh from the current product price at that instant (`getProductForSnapshot`). That's what gets saved to the order and is what the **orders page** displays.

Two different subtotals, computed at two different times, from two different sources → the fee/total the customer sees at checkout doesn't match what shows up on their order afterward. Purely a frontend wiring bug: the component just isn't using the authoritative endpoint it already has access to.

## Fix

```tsx
// checkout-preview.tsx

const [previewSubtotal, setPreviewSubtotal] = useState<number | null>(null);
const [priceChanged, setPriceChanged] = useState(false);

const localSubtotal = useCartSubtotal();

useEffect(() => {
  const loadCheckoutData = async () => {
    if (isSyncingCart) return;

    setIsLoading(true);
    setError(null);

    try {
      const [addressRes, shippingRes, paymentRes, checkoutRes] =
        await Promise.all([
          cartService.getAddresses(),
          cartService.getShippingOptions(),
          cartService.getPaymentMethods(),
          cartService.initiateCheckout(), // <-- was missing
        ]);

      // ...existing address/shipping/payment handling...

      if (checkoutRes.success && checkoutRes.preview) {
        setPreviewSubtotal(checkoutRes.preview.subtotal);
        setPriceChanged(checkoutRes.preview.subtotal !== localSubtotal);
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

// Use the server-verified number as the source of truth, falling back
// to local only if the preview call failed outright.
const subtotal = previewSubtotal ?? localSubtotal;
const shippingCost = selectedShipping?.price || 0;
const paymentFee = selectedPayment?.fee || 0;
const total = subtotal + shippingCost + paymentFee;
```

And surface it instead of silently letting the number jump between pages:

```tsx
{
  priceChanged && (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800">
        Beberapa harga produk telah diperbarui sejak ditambahkan ke keranjang.
        Total di bawah ini sudah menggunakan harga terbaru.
      </p>
    </div>
  );
}
```

This guarantees the number shown on the "Bayar Sekarang" button and the order summary sidebar is the same number the backend will actually charge and later render on the orders page — because it now comes from the same call.

## Caveat I can't fully close from the frontend alone

The `shippingFee`/`paymentFee` piece of the total still comes from `GET /shipping-options` and `GET /payment-methods`. Whether _those_ numbers match what the backend actually charges at `POST /checkout/complete` depends on whether the backend's checkout service reads from the same source as those two endpoints, or from a separate hardcoded copy — that's backend-owned code I don't have visibility into from here. The subtotal fix above closes the biggest and most likely source of drift, but if fee mismatches persist after this, it points to that backend duplication and needs a backend engineer to consolidate the source of truth there.

```

## Version 3

#### Context

```

Now keep it all together.

Add the following context. Project Pasaria ecommerce built using

| Component | Technology                              |
| --------- | --------------------------------------- |
| Backend   | Express + TypeScript + Modular Monolith |
| Database  | PostgreSQL + Prisma                     |
| Cache     | Redis                                   |
| Queue     | BullMQ                                  |
| Frontend  | Next.js 14+                             |
| Search    | PostgreSQL FTS                          |

The goal is production-ready code.

Fix the bug.

```

#### Output (Claude)

```

Combining both fixes into one production-ready change, using the actual stack (Prisma as the source of truth, Redis as the cache in front of it, not another hardcoded array).

## Recap of the bug

Two independent issues compound into "checkout fee ≠ orders fee":

1. **Backend**: `checkout.service.ts` hardcodes its own copy of shipping/payment pricing instead of reading from wherever `shipping.controller.ts` / `payment-methods.controller.ts` get theirs. Two sources of truth, no way to keep them in sync, and no correct handling of the `credit_card` percentage fee.
2. **Frontend**: `checkout-preview.tsx` computes `subtotal` from the `localStorage`-persisted Zustand cart (`item.price`) instead of calling the `initiateCheckout()` endpoint that already exists and returns the live, server-computed subtotal.

The real fix isn't "consolidate into a second TypeScript constants file" — that's still a hardcoded array someone has to redeploy to change, and it still doesn't fix the percentage-fee bug. For a production modular monolith with Postgres/Prisma and Redis already in the stack, pricing config belongs in the database, fronted by a cache.

---

## 1. Schema — single source of truth (Prisma)

```prisma
// backend/prisma/schema.prisma

model ShippingOption {
  id        String   @id
  name      String
  price     Int      // in smallest currency unit (Rupiah, no decimals)
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  updatedAt DateTime @updatedAt

  @@map("shipping_options")
}

enum FeeType {
  FLAT
  PERCENTAGE
}

model PaymentMethodConfig {
  id        String   @id
  name      String
  type      String   // 'bank_transfer' | 'ewallet' | 'credit_card' | 'convenience_store' | 'qr_code'
  provider  String
  fee       Decimal  @db.Decimal(10, 4) // flat rupiah OR percentage points, per feeType
  feeType   FeeType  @default(FLAT)
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  updatedAt DateTime @updatedAt

  @@map("payment_method_configs")
}
```

```bash
npx prisma migrate dev --name add_checkout_pricing_config
```

Seed (`backend/prisma/seed.ts`) with the existing values, now with `credit_card` correctly marked `PERCENTAGE`:

```ts
await prisma.paymentMethodConfig.upsert({
  where: { id: 'credit_card' },
  update: {},
  create: {
    id: 'credit_card',
    name: 'Kartu Kredit',
    type: 'credit_card',
    provider: 'Visa/Mastercard',
    fee: 2.9,
    feeType: 'PERCENTAGE',
    sortOrder: 8,
  },
});
// ...same pattern for bca_va (FLAT, 4000), gopay (FLAT, 2000), qris (FLAT, 0), etc.
// ...jne_reg / jne_yes / pos_kilat / tiki_reg / grab_express into ShippingOption (all FLAT price)
```

## 2. Shared pricing module — Redis cache-aside in front of Prisma

```ts
// backend/shared/pricing/pricing.service.ts

import { prisma } from '../../infra/db/prisma.js';
import { redis } from '../../infra/cache/redis.js';

const CACHE_TTL_SECONDS = 300; // 5 min — pricing changes rarely, staleness window is acceptable
const SHIPPING_KEY = 'pricing:shipping-options';
const PAYMENT_KEY = 'pricing:payment-methods';

export interface ShippingOptionDTO {
  id: string;
  name: string;
  price: number;
}
export interface PaymentMethodDTO {
  id: string;
  name: string;
  type: string;
  provider: string;
  fee: number;
  feeType: 'FLAT' | 'PERCENTAGE';
}

export const PricingService = {
  async getShippingOptions(): Promise<ShippingOptionDTO[]> {
    const cached = await redis.get(SHIPPING_KEY);
    if (cached) return JSON.parse(cached);

    const rows = await prisma.shippingOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    const result = rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
    }));
    await redis.set(
      SHIPPING_KEY,
      JSON.stringify(result),
      'EX',
      CACHE_TTL_SECONDS,
    );
    return result;
  },

  async getPaymentMethods(): Promise<PaymentMethodDTO[]> {
    const cached = await redis.get(PAYMENT_KEY);
    if (cached) return JSON.parse(cached);

    const rows = await prisma.paymentMethodConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    const result = rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      provider: r.provider,
      fee: Number(r.fee),
      feeType: r.feeType,
    }));
    await redis.set(
      PAYMENT_KEY,
      JSON.stringify(result),
      'EX',
      CACHE_TTL_SECONDS,
    );
    return result;
  },

  /** Correctly resolves a fee for either FLAT or PERCENTAGE methods. */
  calculatePaymentFee(method: PaymentMethodDTO, subtotal: number): number {
    if (method.feeType === 'PERCENTAGE') {
      return Math.round(subtotal * (method.fee / 100));
    }
    return method.fee;
  },

  /** Call this from an admin-update mutation so stale cache never outlives a price change. */
  async invalidateCache(): Promise<void> {
    await redis.del(SHIPPING_KEY, PAYMENT_KEY);
  },
} as const;
```

This is the _one_ place shipping/payment pricing is ever read from. No TS array can drift from another TS array anymore — there's only the DB row, cached.

## 3. Controllers now read from the same place the checkout service does

```ts
// backend/modules/shipping/shipping.controller.ts (relevant handler)
async getShippingOptions(_req: Request, res: Response) {
  const options = await PricingService.getShippingOptions()
  res.status(200).json({ success: true, options })
}
```

```ts
// backend/modules/payment-methods/payment-methods.controller.ts (relevant handler)
async getPaymentMethods(_req: Request, res: Response) {
  const methods = await PricingService.getPaymentMethods()
  res.status(200).json({ success: true, methods })
}
```

## 4. `checkout.service.ts` — delete the hardcoded arrays, fix the percentage bug

```ts
import { PricingService } from "../../shared/pricing/pricing.service.js"

// getShippingOption / getPaymentMethod helper functions and the two
// SHIPPING_OPTIONS / PAYMENT_METHODS const arrays are deleted entirely.

async completeCheckout(input: CompleteCheckoutInput): Promise<CompleteCheckoutResult> {
  const { userId, selectedShippingId, selectedPaymentId } = input

  const preview = await this.initiateCheckout({ userId })
  CheckoutRules.assertPreviewValidForCompletion(preview)
  CheckoutRules.assertCartExists(preview.summary.cartId)

  const [shippingOptions, paymentMethods] = await Promise.all([
    PricingService.getShippingOptions(),
    PricingService.getPaymentMethods(),
  ])
  const shippingOption = shippingOptions.find((s) => s.id === selectedShippingId) ?? null
  const paymentMethod = paymentMethods.find((p) => p.id === selectedPaymentId) ?? null

  const shippingFee = shippingOption?.price ?? 0
  const adminFee = paymentMethod
    ? PricingService.calculatePaymentFee(paymentMethod, preview.summary.subtotal)
    : 0

  // ...rest of the transaction is unchanged (order/inventory/cart), still the
  // sole transaction owner, still fire-and/forget queue enqueue after commit.
}
```

`credit_card` now correctly charges 2.9% of the subtotal instead of a flat Rp 2.9, and every endpoint — preview, completion, and the orders page after the fact — is reading fee data from the exact same query path.

## 5. Frontend — wire the preview call and match the fee math

```tsx
// checkout-preview.tsx

const [previewSubtotal, setPreviewSubtotal] = useState<number | null>(null);
const [priceChanged, setPriceChanged] = useState(false);
const localSubtotal = useCartSubtotal();

useEffect(() => {
  const loadCheckoutData = async () => {
    if (isSyncingCart) return;
    setIsLoading(true);
    setError(null);
    try {
      const [addressRes, shippingRes, paymentRes, checkoutRes] =
        await Promise.all([
          cartService.getAddresses(),
          cartService.getShippingOptions(),
          cartService.getPaymentMethods(),
          cartService.initiateCheckout(),
        ]);
      // ...existing address/shipping/payment handling unchanged...

      if (checkoutRes.success && checkoutRes.preview) {
        setPreviewSubtotal(checkoutRes.preview.subtotal);
        setPriceChanged(checkoutRes.preview.subtotal !== localSubtotal);
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

const subtotal = previewSubtotal ?? localSubtotal;
```

```ts
// frontend/src/store/cart.types.ts
export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  provider: string;
  icon: string;
  description?: string;
  fee: number;
  feeType: 'FLAT' | 'PERCENTAGE'; // now returned by the API
  minAmount?: number;
  maxAmount?: number;
}
```

```tsx
// checkout-preview.tsx — replace the flat-only fee math
const paymentFee = selectedPayment
  ? selectedPayment.feeType === 'PERCENTAGE'
    ? Math.round(subtotal * (selectedPayment.fee / 100))
    : selectedPayment.fee
  : 0;
const total = subtotal + shippingCost + paymentFee;
```

Same `Math.round(subtotal * (fee / 100))` formula as `PricingService.calculatePaymentFee` on the backend — display and charge now compute identically, from identical inputs.

```tsx
{
  priceChanged && (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800">
        Beberapa harga produk telah diperbarui. Total di bawah menggunakan harga
        terbaru.
      </p>
    </div>
  );
}
```

## Why this closes the bug for good

- **One row, not two arrays**: pricing lives in Postgres via Prisma; `checkout.service.ts` and both `GET` controllers call the same `PricingService`, so drift is structurally impossible.
- **Redis is used correctly**: as a cache in front of the DB with a short TTL and an explicit `invalidateCache()` hook for whenever pricing is edited (e.g., an admin endpoint), rather than as the source of truth itself.
- **Percentage fees are actually percentage fees** — `credit_card` and any future percentage-based method compute off the real subtotal, identically on both sides.
- **The frontend total is honest**: it's built from the server-verified subtotal (`initiateCheckout`) plus fee data fetched from the same DB-backed endpoints the backend charges from, so what the customer sees at checkout is what lands on the order.

One thing worth a follow-up ticket rather than bundling into this fix: an admin-facing mutation endpoint for `ShippingOption`/`PaymentMethodConfig` that calls `PricingService.invalidateCache()` on write — right now the schema/cache plumbing is ready for it, but there's no CRUD surface yet for someone to actually change a price without touching the DB directly.

```

## Version 4

#### Few-shot

```

From the previous code, I want you to review code formatted like this
Problem
Cause
Fix
Testing
Now review mine.

```

#### Output (Claude)

```

## Problem

The fee/total shown on the checkout page doesn't match the fee/total shown on the orders page after the order is placed. Specifically:

- Shipping and admin (payment) fees can differ between what the customer sees before paying and what's actually charged.
- Credit card fee is effectively free (should be 2.9% of subtotal, charged as flat ~Rp 3).
- Subtotal itself can silently drift between checkout and order.

## Cause

Three independent defects compounding into one symptom:

1. **Duplicated pricing config, backend.** `checkout.service.ts` hardcodes its own copy of `SHIPPING_OPTIONS` / `PAYMENT_METHODS`, separate from whatever `shipping.controller.ts` and `payment-methods.controller.ts` serve to the frontend. Two sources of truth with no sync mechanism — whichever one gets updated, the other silently goes stale.
2. **Percentage fee treated as flat, both sides.** `credit_card` has `fee: 2.9` with a `// percentage-based` comment, but nothing ever multiplies it by subtotal — it's added as a flat Rp 2.9 everywhere it's used.
3. **Stale client-side subtotal, frontend.** `checkout-preview.tsx` computes `subtotal` from the Zustand cart store (`item.price`, persisted to `localStorage`) instead of calling `cartService.initiateCheckout()` — which already exists and returns the server-computed subtotal from live product prices. The backend, meanwhile, recomputes subtotal fresh at order-creation time. Two different snapshots in time, two different numbers.

## Fix

- Moved shipping/payment pricing into Prisma (`ShippingOption`, `PaymentMethodConfig` with a `feeType: FLAT | PERCENTAGE` column), cached in Redis via a single `PricingService`.
- Both `GET` controllers and `checkout.service.ts` now read exclusively through `PricingService` — one code path, can't drift.
- Added `PricingService.calculatePaymentFee()`, correctly branching on `feeType` (`Math.round(subtotal * fee/100)` for percentage).
- Frontend now calls `cartService.initiateCheckout()` on load and uses the returned `preview.subtotal` as the source of truth (falling back to local only on failure), with a banner if it differs from the cached local value.
- Frontend fee math mirrors the backend formula exactly (`feeType` now returned by the API and branched on client-side too).

## Testing

Given this is presented as a finished plan rather than a diff I've run, here's what I'd actually verify before calling it done — none of this has been executed yet:

- **Unit**: `PricingService.calculatePaymentFee` — flat method returns `fee` unchanged; percentage method (e.g. `credit_card`, 2.9%) returns `round(subtotal * 0.029)` for a few subtotal values including edges (0, 1, very large).
- **Integration**: `POST /checkout` → `POST /checkout/complete` with each payment method id, asserting `order.adminFee` matches `PricingService.calculatePaymentFee` computed independently in the test. Same for shipping.
- **Cache correctness**: write a new price via Prisma directly, confirm stale Redis value is still served until TTL/explicit invalidation, then confirm `invalidateCache()` makes the change visible immediately — this needs an admin write path to exist first, which is the follow-up ticket I flagged and didn't build here.
- **Frontend**: checkout page subtotal matches `GET /checkout` response subtotal in a case where cart was loaded from stale `localStorage` (simulate by manually editing a cached `item.price`); confirm the "price changed" banner fires; confirm the number displayed pre-payment equals `order.subtotal` post-payment.
- **Regression on existing behavior**: `qris` (fee 0) still shows "Gratis" and contributes Rp 0 to total; disabled/inactive payment methods and shipping options no longer appear in either endpoint.
- **E2E**: full checkout flow per payment method type (flat bank VA, flat e-wallet, percentage credit card, zero-fee QRIS), diffing the total shown at the "Bayar Sekarang" button against the total rendered on the resulting order detail page — this is the actual regression test for the bug as originally reported.

```

## Version 5

#### Output Structure

```

Output Structure
Return:
Problem
Root Cause
Solution
Files to Modify
Testing Steps
Possible Risks

```

#### Output (Claude)

```

Problem

The fee/total shown on the checkout page does not match the fee/total shown on the orders page after an order is placed. Symptoms:

- Shipping and admin (payment) fees can differ between what's displayed pre-payment and what's actually charged/stored.
- Credit card fee is effectively waived (should be 2.9% of subtotal, currently applied as a flat ~Rp 3).
- Subtotal itself can silently drift between the checkout page and the resulting order.

Root Cause

Three independent defects compounding into one symptom:

1. Duplicated pricing config (backend). checkout.service.ts hardcodes SHIPPING_OPTIONS / PAYMENT_METHODS arrays, separate from whatever shipping.controller.ts and payment-methods.controller.ts serve to the frontend. Two sources of truth, no sync mechanism — updating one silently leaves the other stale.
2. Percentage fee treated as flat (both sides). credit_card has fee: 2.9 marked "percentage-based" in a comment, but it's never multiplied against subtotal anywhere — it's added as a flat currency amount everywhere it's used, backend and frontend alike.
3. Stale client-side subtotal (frontend). checkout-preview.tsx computes subtotal from the Zustand cart store (item.price, persisted to localStorage) instead of calling the existing cartService.initiateCheckout(), which returns the server-computed subtotal from live product prices. The backend recomputes subtotal fresh at order-creation time. Two different snapshots in time, two different numbers.

Solution

- Move shipping/payment pricing into Prisma (ShippingOption, PaymentMethodConfig with a feeType: FLAT | PERCENTAGE column), cached in Redis behind a single PricingService.
- Both GET controllers (shipping, payment-methods) and checkout.service.ts read exclusively through PricingService — one code path, drift becomes structurally impossible.
- Add PricingService.calculatePaymentFee(), branching correctly on feeType (Math.round(subtotal \* fee/100) for percentage, flat fee otherwise).
- Frontend calls cartService.initiateCheckout() on checkout-page load and uses the returned preview.subtotal as the source of truth (local Zustand value only as a fallback if the call fails), with a banner shown if it differs from the locally cached value.
- Frontend fee math mirrors the backend formula exactly — feeType is now returned by the payment-methods API and branched on client-side too, so the displayed total and the charged total are computed identically.

Files to Modify

Backend:

- backend/prisma/schema.prisma — add ShippingOption, PaymentMethodConfig, FeeType enum
- backend/prisma/seed.ts — seed existing prices, mark credit_card as PERCENTAGE
- backend/shared/pricing/pricing.service.ts — new file, cache-aside PricingService
- backend/modules/checkout/checkout.service.ts — remove hardcoded arrays, call PricingService, use calculatePaymentFee
- backend/modules/shipping/shipping.controller.ts — read from PricingService instead of local data
- backend/modules/payment-methods/payment-methods.controller.ts — read from PricingService instead of local data

Frontend:

- frontend/src/components/features/cart/checkout-preview/checkout-preview.tsx — call initiateCheckout(), use preview.subtotal, branch fee calc on feeType, add price-changed banner
- frontend/src/store/cart.types.ts — add feeType to PaymentMethod
- frontend/src/types/api/checkout.types.ts — confirm CheckoutSummary/subtotal shape matches what initiateCheckout() consumes

Testing Steps

1. Unit — PricingService.calculatePaymentFee: flat method returns fee unchanged; percentage method (credit_card, 2.9%) returns round(subtotal \* 0.029) across several subtotal values including 0 and large values.
2. Integration — POST /checkout then POST /checkout/complete for every payment method id; assert order.adminFee equals calculatePaymentFee computed independently in the test. Repeat for shipping fee.
3. Cache correctness — update a price via Prisma directly, confirm the stale Redis value is still served until TTL/invalidateCache(), then confirm invalidation makes the new price visible immediately (requires the admin write path noted below, which doesn't exist yet).
4. Frontend — simulate a stale localStorage cart (edit a cached item.price manually), confirm checkout page subtotal matches the GET /checkout response, confirm the price-changed banner fires, confirm the pre-payment total equals order.subtotal post-payment.
5. Regression — qris (fee 0) still renders "Gratis" and contributes Rp 0; inactive/disabled shipping options and payment methods no longer appear in either endpoint.
6. E2E — full checkout per payment type (flat bank VA, flat e-wallet, percentage credit card, zero-fee QRIS), diffing the total on the "Bayar Sekarang" button against the total on the resulting order detail page. This is the direct regression test for the originally reported bug.

Possible Risks

- Migration risk: adding ShippingOption/PaymentMethodConfig tables and seeding them is a deploy-order dependency — checkout.service.ts must not go live reading from PricingService before the seed has run, or getShippingOptions()/getPaymentMethods() return empty and every checkout fails closed (shippingFee/adminFee silently become 0 rather than erroring, if the ?? 0 fallbacks aren't tightened).
- Cache staleness window: a 5-minute Redis TTL means a price change made directly in the DB (without hitting the not-yet-built admin endpoint) can take up to 5 minutes to propagate, and during that window checkout and orders could disagree again in the opposite direction. No invalidation hook exists yet outside a future admin mutation.
- Rounding drift: Math.round() on percentage fees must be identical on frontend and backend (same rounding mode, same input precision) or off-by-one-rupiah mismatches reappear for credit_card specifically. Needs an explicit shared-rounding-rule test, not just equal formulas.
- Behavior change for existing orders: credit_card fee moving from flat ~Rp 3 to ~2.9% of subtotal is a material pricing change, not just a bug fix — needs product/business sign-off and possibly a feature flag or rollout plan, not just a silent deploy.
- No admin CRUD surface yet: PricingService.invalidateCache() has no caller in this change set. Until a write path exists, prices can only be changed via direct DB edits, which is easy to forget to pair with cache invalidation in production.
- Backward compatibility: frontend PaymentMethod type gains a required feeType field — any other frontend code consuming GET /payment-methods (not just checkout-preview.tsx) needs to be checked for type errors or assumed-flat-fee logic.

```

## Version 6

#### Step Decomposition

```

Before suggesting fixes
1 Analyze state
2 Analyze API
3 Analyze async flow
4 Analyze rendering
Only then conclude.

```

#### Output (Claude)

```

1. State Analysis

Zustand cart store (`cart.store.ts`), persisted to localStorage, `partialize` keeps only `items`:

- items[].price → snapshot price at time item was added to cart, persisted, can be arbitrarily old
- items[].currentPrice → live price, used only by useHasPriceChanges / useIsCheckoutDisabled, never read for totals
- checkoutPreview → field + setCheckoutPreview() exist in the store, clearly built to hold the
  authoritative backend preview — but checkout-preview.tsx never calls setCheckoutPreview() and
  never reads store.checkoutPreview. It's dead state.
- selectedShipping → same pattern: exists in store with a setter, unused by the component, which
  keeps its own separate selectedShippingId in local useState instead.

checkout-preview.tsx local state:

- addresses / shippingOptions / paymentMethods → populated from API responses, fine
- selectedAddressId / selectedShippingId / selectedPaymentId → local only, fine (these are choices,
  not derived data)
- subtotal is NOT state — it's a derived hook value (useCartSubtotal()) reading directly from the
  persisted store, recomputed every render from item.price

Finding: there are two parallel, unreconciled representations of "the checkout total" — one in the
Zustand store (checkoutPreview, unused) and one implicit in local component derivations (subtotal,
shippingCost, paymentFee, total). Nothing in state ever holds the server's computed subtotal.

2. API Analysis

Called by checkout-preview.tsx: getAddresses, getShippingOptions, getPaymentMethods, completeCheckout.
NOT called: initiateCheckout() — POST /checkout, despite existing in cartService.ts and existing
specifically to return a server-computed subtotal.

Contract gaps found on inspection of cartService.ts:

- initiateCheckout()'s own mapping is partially broken:
  preview: { subtotal: data.data.summary?.subtotal, shipping: 0, total: data.data.summary?.subtotal }
  `shipping` is hardcoded to 0 and `total` is just subtotal — shipping/payment fee are never folded
  in server-side at preview time (correct, since selection hasn't happened yet), but the field names
  imply otherwise. Any caller treating preview.total as "the total" would be wrong. Only
  preview.subtotal is trustworthy from this response.

- getPaymentMethods() returns `fee: number` with no `feeType`. There is no way, from this API
  response alone, for a correct client to know credit_card's 2.9 means "2.9%" rather than "Rp 2.9".
  This is a backend contract gap, not something fixable by reordering frontend code.

- completeCheckout() only returns { success, orderId } — it does not return the computed
  shippingFee/adminFee/total it just persisted. The frontend has no way to confirm, at the moment of
  purchase, that what it displayed matches what was charged; it has to trust its own pre-computation
  and separately fetch the order afterward to find out if it was right. This is the actual mechanism
  by which "checkout page total" and "order page total" can diverge without any error ever surfacing.

3. Async Flow Analysis

Effect A — syncCartToBackend, deps: [items.length]

- Clears backend cart, then awaits cartService.addItem() sequentially per item in a for-loop.
- Failures are caught and swallowed: "Continue anyway - checkout might still work." No error state
  is set, no retry, no partial-failure indication to the user.
- Dependency is items.length only, not items itself — a quantity change on an existing line (no
  length change) after this effect has already run will NOT re-trigger a re-sync. The backend cart
  can silently diverge from the local cart mid-session.

Effect B — loadCheckoutData, deps: [isSyncingCart]

- Correctly gated behind isSyncingCart to guarantee ordering (sync completes before checkout data
  loads) — this part is sound.
- Fires getAddresses / getShippingOptions / getPaymentMethods in parallel. If initiateCheckout() is
  added here, it is correctly sequenced after the sync, so in the common case (fresh mount, no
  mid-session qty edits) it would reflect the just-synced backend cart.

Compounding risk: because Effect A's silent failure and stale dependency array mean the backend cart
is not guaranteed to match the local cart at the moment initiateCheckout() would be called, simply
adding an initiateCheckout() call does not fully guarantee correctness — it guarantees the number
matches what the backend _thinks_ the cart is, which is not always what the frontend _shows_. The
async flow has to be fixed (sync errors surfaced, sync re-triggered on quantity change, or the sync
step removed in favor of a single idempotent "set cart contents" call) for the state fix to be
trustworthy end to end.

4. Rendering Analysis

- Per-item rows (order summary sidebar, confirm step) render item.price directly from local state:
  `item.quantity}x Rp {item.price}` and `{item.price * item.quantity}`. These are independent render
  paths from the aggregate subtotal.
- If subtotal is switched to the server-computed previewSubtotal (per the prior plan) while these
  per-item rows keep rendering local item.price, the sum of the visibly rendered line items will not
  equal the "Subtotal" line beneath them whenever any price has drifted. That reads as a visible
  arithmetic bug to the user — trading one mismatch (checkout vs orders page) for a new one (line
  items vs subtotal, on the same page). Fixing the aggregate without reconciling the per-item render
  path is an incomplete fix.
- Payment method fee badge (`method.fee > 0 ? '+Rp {fee}' : 'Gratis'`) renders the raw fee number
  with a Rupiah prefix unconditionally. For credit_card this renders "+Rp 3", which is not just
  numerically wrong (before any total-level bug even applies) but semantically wrong — it presents a
  percentage as a currency amount at the point of selection, independent of whatever the aggregate
  total does later.
- Loading states (isSyncingCart → isLoading) correctly gate rendering until data settles; adding
  initiateCheckout() to the existing Promise.all does not introduce a new loading-state bug.

Conclusion

Problem
Fee/total shown on the checkout page can differ from the fee/total on the resulting order, and the
credit card fee renders as an unintended flat ~Rp 3 instead of 2.9% of subtotal.

Root Cause

- State: the store already has a slot for the authoritative server preview (checkoutPreview) that the
  component never populates or reads; it derives totals from persisted, possibly-stale local state
  instead.
- API: initiateCheckout() is unused; its response shape (shipping:0, total:subtotal) is also
  misleading; getPaymentMethods() doesn't expose feeType, so no caller can compute a percentage fee
  correctly; completeCheckout() doesn't return the totals it actually charged, so there's no
  confirmation step.
- Async flow: cart-to-backend sync can silently fail (swallowed errors) and won't re-run on
  quantity-only changes, so even a correctly-called server preview can reflect a different cart than
  what's on screen.
- Rendering: per-item rows and the payment-method fee badge render raw local/raw-fee values
  independent of whatever the aggregate total logic does, so fixing the total alone leaves other
  visibly inconsistent numbers on the same page.

Solution

1. Backend: add feeType (FLAT | PERCENTAGE) to the payment-methods response and to
   completeCheckout()'s return payload (echo back shippingFee/adminFee/total actually persisted).
2. Backend: consolidate shipping/payment pricing into one source (Prisma-backed PricingService,
   Redis-cached) read by both the GET endpoints and checkout.service.ts, with a correct
   calculatePaymentFee() that branches on feeType.
3. Frontend state: call initiateCheckout() in the existing load effect, store the result in the
   Zustand checkoutPreview slot that already exists (rather than a new parallel local state var), and
   derive subtotal, per-item unit prices, and payment fee badges from that single object everywhere
   they're rendered — sidebar, confirm step, and the payment-method list.
4. Frontend async flow: surface sync errors instead of swallowing them (block "next" or show a
   retryable banner), and change Effect A's dependency to the full items array (or a content hash) so
   a quantity-only edit re-triggers sync before the preview is trusted.
5. Frontend rendering: replace the flat "+Rp {fee}" badge with feeType-aware rendering
   ("2.9%" for percentage methods, computed Rupiah amount only once subtotal is known), and source
   per-item unit prices from preview.items so the visible line items always sum to the visible
   subtotal.

Files to Modify
Backend: payment-methods.controller.ts (add feeType to response), checkout.controller.ts /
checkout.service.ts (return + use feeType-aware fee calc), checkout.types.ts (CompleteCheckoutResult
already has the right shape, verify controller actually returns it — confirmed it does).
Frontend: cart.store.ts (start actually using checkoutPreview/setCheckoutPreview), cart.service.ts
(fix initiateCheckout()'s shipping/total mapping, add feeType passthrough), checkout-preview.tsx
(call initiateCheckout, source all price displays from one preview object, feeType-aware fee badge,
surface sync errors, fix Effect A's dependency array), cart.types.ts / checkout.types.ts (add
feeType field).

Testing Steps

1. Unit: calculatePaymentFee for FLAT vs PERCENTAGE, both backend and the mirrored frontend formula,
   asserting identical output for the same inputs.
2. Integration: complete checkout per payment method, assert completeCheckout()'s returned
   shippingFee/adminFee/total equal what's persisted on the order.
3. Async-flow test: mount checkout page, change an item's quantity without changing item count,
   confirm Effect A re-fires and the previewSubtotal reflects the new quantity before checkout can
   be completed.
4. Failure-path test: force one addItem() call in the sync loop to fail, confirm the user sees an
   error/retry state rather than proceeding on a silently incomplete backend cart.
5. Rendering test: for a cart with a price drift, assert sum(rendered per-item rows) === rendered
   "Subtotal" line, on both the sidebar and the confirm step.
6. E2E: full checkout per payment type, diffing the "Bayar Sekarang" total against the order-detail
   total, including credit_card specifically to confirm 2.9% is applied, not a flat amount.

Possible Risks

- Moving totals into the store's existing checkoutPreview slot may affect other components already
  reading (or expected to read) that slot — audit all consumers before repointing it.
- Tightening Effect A's dependency to the full items array can cause more frequent re-syncs (and thus
  more initiateCheckout() calls) on rapid quantity edits — needs debouncing, not just a wider deps array.
- Surfacing sync errors changes existing UX ("continue anyway" today) to a harder stop — needs
  product sign-off, since it can newly block checkouts that previously silently degraded.
- credit_card moving from flat to percentage fee is a real pricing change, as previously flagged —
  still needs business sign-off independent of this being "just" a bug fix.

````

## Version 7 — Item Doubling Bug (Discovered During Implementation)

### Bug Description

**Bug**: Checkout preview shows 1 item but orders page shows 2 items (or 2 items → 4 items). Always reproducible, deterministic doubling pattern — NOT a race condition.

### Root Cause — Two Independent Bugs

#### Bug 1: Sync Effect Double-Trigger (Items Doubling)

The cart sync `useEffect` in `checkout-preview.tsx` had a critical bug:

```tsx
// PROBLEMATIC CODE (BEFORE FIX)
useEffect(() => {
  const syncCartToBackend = async () => {
    setIsSyncingCart(true);
    await cartService.clearCart(); // Clears backend cart
    for (const item of items) {
      await cartService.addItem({ productId, quantity });
      // ⚠️ addItem() updates local Zustand store → items.length changes
      // ⚠️ This triggers ANOTHER effect run!
    }
    setIsSyncingCart(false);
  };
  syncCartToBackend();
}, [items.length]); // ⚠️ DEPENDENCY ON items.length = ROOT CAUSE
```

**The Problem (deterministic, not random)**:

1. Component mounts with items (e.g., 2 items)
2. Effect #1 triggers, sets `isSyncingCart = true`
3. Loop starts: `addItem()` updates local store → `items.length` becomes 3
4. React detects `items.length` change → schedules Effect #2
5. Loop finishes (items.length = 4), `isSyncingCart = false`
6. Effect #2 runs because `items.length` changed from 2 to 4
7. Backend receives items TWICE → 2x doubling

**Result**: 2 items in cart → 4 items in order (deterministic)

#### Bug 2: addItem() INCREMENT vs updateQuantity() REPLACE

Even after fixing Bug 1, the sync still caused doubling because `addItem()` uses backend's **upsert + increment** semantics:

```ts
// backend cart.service.ts (addToCart)
update: { quantity: { increment: quantity } },  // INCREMENT, not replace!
```

**The Problem:**

1. User adds item to cart (qty=1) → local: qty=1, backend: qty=1 ✅
2. Checkout sync sends `addItem({ productId, quantity: 1 })` for each item
3. Backend increments existing item → qty becomes **2** (doubled!) ❌

Even with empty deps `[]` preventing double-trigger, the sync itself doubles items!

#### Bug 3: Items NOT Synced to Backend on Add

The `addItem()` call in Zustand cart store only updates local state (persisted to localStorage) — it never syncs to backend. `updateQuantity()` in cart-page calls backend, but only for EXISTING items.

**The Problem:**

1. User adds item via product page → only local Zustand store updated (localStorage)
2. Backend cart is EMPTY for this user
3. Checkout sync calls `updateQuantity()` for each local item
4. Backend returns **404** (item doesn't exist in backend cart) → sync silently fails
5. Backend cart remains empty → `completeCheckout()` creates order with **0 items** ❌

**Evidence**: `GET http://localhost:3001/cart 404` (unauthenticated request or items not in backend)

### Fix Applied

The final fix eliminates the sync entirely — backend cart IS the source of truth:

1. **Empty dependency array** `[]` to ensure single execution on mount only
2. **useRef** to capture items at effect execution time (not closure stale)
3. **isCancelled flag** for cleanup if component unmounts
4. **Sync error surfaced** to user via amber warning banner
5. **REPLACED sync loop with `getCart()`** — instead of pushing local items to backend, read from backend cart directly

```tsx
// FIXED CODE (FINAL)
useEffect(() => {
  let isCancelled = false;

  const syncCartToBackend = async () => {
    const currentItems = itemsRef.current;

    if (currentItems.length === 0) {
      if (!isCancelled) setIsLoading(false);
      return;
    }

    if (!isCancelled) {
      setIsSyncingCart(true);
      setSyncError(null);
    }

    try {
      // Load cart directly from backend (source of truth)
      // Instead of pushing local items to backend, just READ from backend
      // This eliminates ALL sync complexity:
      // - No increment vs replace confusion
      // - No double-trigger bug
      // - No 404 on items not yet in backend
      const cartResponse = await cartService.getCart();
      if (cartResponse.success && cartResponse.cart?.items) {
        const backendItems = cartResponse.cart.items;
        console.log(`[Checkout] Loaded ${backendItems.length} items from backend cart`);
      }
    } catch (err) {
      console.error('Failed to load cart from backend:', err);
      if (!isCancelled) {
        setSyncError('Gagal memuat keranjang dari server. Checkout mungkin tidak berjalan dengan benar.');
      }
    } finally {
      if (!isCancelled) setIsSyncingCart(false);
    }
  };

  syncCartToBackend();
  return () => {
    isCancelled = true;
  };
}, []); // Empty deps = run ONCE on mount only
```

**Why this works:**
- Items are now synced to backend in TWO places:
  1. **Product page (addToCart)** → Zustand `addItem()` now calls backend via `fetch()` (fire-and-forget)
  2. **Cart page (quantity changes)** → Already calls `cartService.updateQuantity()` which syncs to backend
- Checkout page reads from backend cart → no sync push needed, no doubling possible
- Backend cart = source of truth for all checkout operations

### Files Modified

- `frontend/src/components/features/cart/checkout-preview/checkout-preview.tsx`
  - Added `useRef` and `syncError` state
  - Fixed sync effect to run once on mount (empty dependency array)
  - Added sync error warning banner in UI
  - **REMOVED `clearCart()`** — was causing 404 error + cascade
  - **REPLACED entire sync loop with `cartService.getCart()`** — reads from backend cart (source of truth), eliminates all sync-related bugs

- `frontend/src/store/cart.store.ts`
  - **MODIFIED `addItem()` to sync to backend** — previously only updated local Zustand store (localStorage), now fires async POST to `/cart/items` for new items and PATCH to `/cart/items/:productId` for quantity updates
  - Backend sync is fire-and-forget (non-blocking) to keep UI responsive
  - Failures logged as warnings, not errors — local cart still works offline

### Testing Verification

After fix, verify:

- 1 item in cart → 1 item in order
- 2 items in cart → 2 items in order (NOT 4)
- Sync error banner appears when backend sync fails
- No console errors about cart sync
- `GET /cart` returns correct items from backend
````
