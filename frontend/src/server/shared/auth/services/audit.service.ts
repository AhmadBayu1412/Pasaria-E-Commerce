import { AuthenticatedUser } from "../types/auth.types"

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

export async function recordAudit(
    tx: any,
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
                after: entry.after,
                actorId: context?.user?.id ?? null,
                actorRole: context?.user?.role ?? null,
            }),
            requestId: context?.requestId ?? null,
            createdAt: new Date()
        }
    })
}

export function createAuditEntry(
    action: string,
    entityType: string,
    entityId: number,
    before?: object | null,
    after?: object | null,
): AuditEntry {
    return { action, entityType, entityId, before, after }
}