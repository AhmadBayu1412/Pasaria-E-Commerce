import type {Prisma} from "../../../generated/prisma/client.js"

export interface CreateProductInput {
    name: string;
    price: number;
    stock?: number;  // Optional, default akan diisi di service
}

export interface UpdateProductInput {
    name?: string;
    price?: number;
    stock?: number;
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
}