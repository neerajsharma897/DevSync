import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { auditLogs } from '../../db/schema/audit.js';
import { users } from '../../db/schema/auth.js';
import { eq, and, desc } from 'drizzle-orm';

// ─── INTERNAL HELPER: Log an Action ──────────────────────────────────────────
export const logAuditAction = async (params: {
  actorId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  workspaceId?: string;
  oldValues?: any;
  newValues?: any;
  tx?: any; // optional transaction object
}) => {
  try {
    const dbOrTx = params.tx || db;
    await dbOrTx.insert(auditLogs).values({
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      workspaceId: params.workspaceId || null,
      oldValues: params.oldValues || null,
      newValues: params.newValues || null,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

// ─── GET AUDIT LOGS BY ENTITY ────────────────────────────────────────────────
// GET /api/audit/:entityType/:entityId
export const getEntityAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId } = req.params as Record<string, string>;
    const { limit = 50 } = req.query;

    const parsedLimit = Math.min(parseInt(limit as string, 10) || 50, 100);

    const logs = await db
      .select({
        logId: auditLogs.logId,
        action: auditLogs.action,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        createdAt: auditLogs.createdAt,
        actorId: users.userId,
        actorName: users.fullName,
        actorAvatar: users.avatarUrl,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.userId))
      .where(
        entityType === 'workspace' 
          ? eq(auditLogs.workspaceId, entityId)
          : and(
              eq(auditLogs.entityType, entityType),
              eq(auditLogs.entityId, entityId)
            )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(parsedLimit);

    res.json({ logs });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Server error fetching audit logs.' });
  }
};
