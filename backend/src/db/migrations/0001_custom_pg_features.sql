-- DevSync: Custom migration for PostgreSQL-specific features
-- Run AFTER drizzle-kit generated migrations
-- These handle features Drizzle ORM cannot define declaratively:
--   1. TSVECTOR generated columns (full-text search)
--   2. Circular foreign key constraints
--   3. Self-referencing foreign keys
--   4. GIN indexes for search performance

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. SELF-REFERENCING FKs ON tasks
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_parent
    FOREIGN KEY (parent_task_id) REFERENCES tasks(task_id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_epic
    FOREIGN KEY (epic_id) REFERENCES tasks(task_id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CIRCULAR FKs (tasks ↔ sprints, tasks ↔ messages, sprints ↔ messages)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_sprint
    FOREIGN KEY (sprint_id) REFERENCES sprints(sprint_id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_discussion_thread
    FOREIGN KEY (discussion_thread_id) REFERENCES messages(message_id) ON DELETE SET NULL;

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_thread
    FOREIGN KEY (thread_id) REFERENCES messages(message_id) ON DELETE CASCADE;

ALTER TABLE sprints
  ADD CONSTRAINT fk_sprint_summary_message
    FOREIGN KEY (summary_message_id) REFERENCES messages(message_id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TSVECTOR GENERATED COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE tasks
  ADD COLUMN description_tsv TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('english', description_text)) STORED;

ALTER TABLE messages
  ADD COLUMN body_tsv TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('english', body_text)) STORED;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. GIN INDEXES (full-text search)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Search
CREATE INDEX idx_tasks_title_tsv ON tasks USING GIN(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_tsv ON tasks USING GIN(description_tsv);
CREATE INDEX idx_messages_tsv ON messages USING GIN(body_tsv);

-- Board loading
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id) WHERE sprint_id IS NOT NULL;

-- Message loading
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- Membership checks (hit on every authenticated request)
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id, workspace_id);
CREATE INDEX idx_project_members_user ON project_members(user_id, project_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id, channel_id);
