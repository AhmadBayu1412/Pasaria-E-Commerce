// ============================================================
// PRODUCT LIFECYCLE SERVICE (Documentation)
// 
// IMPLEMENTASI DITUNDA: Karena membutuhkan kolom status di database
// File ini mendokumentasikan planned lifecycle transitions
// ============================================================

/**
 * STEP 3: Product Lifecycle Concept Documentation
 * 
 * Planned Status Values:
 * - DRAFT     = produk baru, hanya seller yang lihat
 * - ACTIVE   = published, semua customer bisa lihat
 * - ARCHIVED = soft delete, tidak visible
 * 
 * Planned Transitions:
 * - DRAFT → ACTIVE    (publish)
 * - ACTIVE → DRAFT    (unpublish)
 * - ACTIVE → ARCHIVED (archive)
 * - ARCHIVED → DRAFT  (restore)
 * 
 * Planned Business Rules:
 * - Cannot publish if price <= 0
 * - Cannot publish if stock < 0
 * - Cannot publish without category (optional)
 * - Archived products tidak terlihat customer
 * 
 * Planned Endpoints:
 * - PATCH /products/:id/status
 * - POST /products/:id/publish
 * - POST /products/:id/archive
 * - POST /products/:id/restore
 */

// ============================================================
// PLACEHOLDER IMPLEMENTATIONS (Will be implemented after DB migration)
// ============================================================

export enum ProductStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED"
    }

    // Valid state transitions
    const VALID_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
    [ProductStatus.DRAFT]: [ProductStatus.ACTIVE],
    [ProductStatus.ACTIVE]: [ProductStatus.ARCHIVED, ProductStatus.DRAFT],
    [ProductStatus.ARCHIVED]: [ProductStatus.DRAFT]
    }

    /**
     * PLACEHOLDER: Publish product (DRAFT → ACTIVE)
     * TODO: Implement after status column exists
     */
    export async function publishProduct(
    _productId: number,
    _user: any
    ): Promise<never> {
    throw new Error(
        "E501: Feature not implemented. " +
        "Publishing requires 'status' column in database. " +
        "Planned for future step."
    )
    }

    /**
     * PLACEHOLDER: Archive product (ACTIVE → ARCHIVED)
     * TODO: Implement after status column exists
     */
    export async function archiveProduct(
    _productId: number,
    _user: any
    ): Promise<never> {
    throw new Error(
        "E501: Feature not implemented. " +
        "Archiving requires 'status' column in database. " +
        "Planned for future step."
    )
    }

    /**
     * PLACEHOLDER: Unpublish product (ACTIVE → DRAFT)
     * TODO: Implement after status column exists
     */
    export async function unpublishProduct(
    _productId: number,
    _user: any
    ): Promise<never> {
    throw new Error(
        "E501: Feature not implemented. " +
        "Unpublishing requires 'status' column in database. " +
        "Planned for future step."
    )
    }

    /**
     * PLACEHOLDER: Restore archived product (ARCHIVED → DRAFT)
     * TODO: Implement after status column exists
     */
    export async function restoreProduct(
    _productId: number,
    _user: any
    ): Promise<never> {
    throw new Error(
        "E501: Feature not implemented. " +
        "Restoring requires 'status' column in database. " +
        "Planned for future step."
    )
}