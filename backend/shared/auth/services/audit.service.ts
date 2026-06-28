import { AuthenticatedUser } from "../types/auth.types"

/**
 * Audit service yang transaction-aware
 * BUKAN menggunakan prisma global, tetapi tx client
 */
export interface AuditEntry {
    action: string
    entityType: string
    entityId: number
    before?: object | null
    after?: object | null
}

export interface AuditContext {
    user?: AuthenticatedUser
    requestId?: string
}

/**
 * Record audit log dalam transaction
 * 
 * @param tx - Prisma transaction client (DIPERSYARATKAN)
 * @param entry - Audit data
 * @param context - User context untuk actorId/actorRole
 */
export async function recordAudit(
    tx: Omit<typeof import("../../../infra/db/prisma.js").prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    entry: AuditEntry,
    context?: AuditContext
): Promise<void> {
    await tx.audit.create({
        data: {
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            data: JSON.stringify({
                before: entry.before,
                after: entry.after
            }),
            actorId: context?.user?.id ?? null,
            actorRole: context?.user?.role ?? null,
            requestId: context?.requestId ?? null,
            createdAt: new Date()
        }
    })
}

/**
 * Convenience function untuk audit dengan authenticated user
 */
export function createAuditEntry(
    action: string,
    entityType: string,
    entityId: number,
    before?: object | null,
    after?: object | null,
): AuditEntry {
    return { action, entityType, entityId, before, after }
}