import type { Prisma } from "@prisma/client"

// OPTIMIZED : Step 7 sellerId dihapus dari input
// karena sellerId selalu berasal dari req.user (session)
export interface CreateProductInput {
    name: string;
    price: number;
    stock?: number;  // Optional, default akan diisi di service
    description?: string; // Untuk sinkronisasi
}

export interface UpdateProductInput {
    name?: string;
    price?: number;
    stock?: number;
    description?: string;
    // Note: sellerId tidak boleh diubah setelah product dibuat
}

// Output type dengan price sebagai number (bukan Decimal string)
export interface ProductOutput {
    id: number;
    name: string;
    description: string | null;
    price: number;  // number, bukan string
    stock: number;
    createdAt: Date;
    updatedAt: Date;
    sellerId: number; // STEP 7: Include sellerId di output
} 