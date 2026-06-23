import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth.js';
import { workspaces } from './workspaces.js';

// ─── audit_logs ──────────────────────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  logId:      uuid('log_id').primaryKey().defaultRandom(),
  actorId:    uuid('actor_id').references(() => users.userId, { onDelete: 'set null' }),
  action:     varchar('action', { length: 100 }).notNull(), // e.g. task.create, sprint.close
  entityType: varchar('entity_type', { length: 30 }),
  entityId:   uuid('entity_id'),
  workspaceId: uuid('workspace_id').references(() => workspaces.workspaceId, { onDelete: 'cascade' }),
  oldValues:  jsonb('old_values'),
  newValues:  jsonb('new_values'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.userId] }),
  workspace: one(workspaces, { fields: [auditLogs.workspaceId], references: [workspaces.workspaceId] })
}));
