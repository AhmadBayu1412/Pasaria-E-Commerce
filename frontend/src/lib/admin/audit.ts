/**
 * Admin Audit Types
 * Audit trail for admin actions
 */

export interface AuditLog {
  id: number;
  entity: 'order' | 'product' | 'user';
  entityId: number;
  entityName?: string;
  action: string;
  actorId: number;
  actorName: string;
  changes: AuditChange[];
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Create audit log entry
 */
export function createAuditLog(
  entity: AuditLog['entity'],
  entityId: number,
  action: string,
  actor: { id: number; name: string },
  changes: AuditChange[],
): Omit<AuditLog, 'id'> {
  return {
    entity,
    entityId,
    action,
    actorId: actor.id,
    actorName: actor.name,
    changes,
    timestamp: new Date().toISOString(),
  };
}
