import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth.js';
import { projects } from './projects.js';
import { tasks } from './tasks.js';

// ─── github_connections ──────────────────────────────────────────────────────
export const githubConnections = pgTable('github_connections', {
  connectionId:     uuid('connection_id').primaryKey().defaultRandom(),
  projectId:        uuid('project_id').references(() => projects.projectId, { onDelete: 'cascade' }).unique(),
  connectedBy:      uuid('connected_by').references(() => users.userId, { onDelete: 'set null' }),
  githubRepoFullName: varchar('github_repo_full_name', { length: 300 }).notNull(),
  githubRepoId:     bigint('github_repo_id', { mode: 'number' }),
  defaultBranch:    varchar('default_branch', { length: 200 }).default('main'),
  githubAccessToken: text('github_access_token'), // encrypted
  webhookId:        bigint('webhook_id', { mode: 'number' }),
  webhookSecret:    text('webhook_secret'), // encrypted
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── github_commits ──────────────────────────────────────────────────────────
export const githubCommits = pgTable('github_commits', {
  id:                uuid('id').primaryKey().defaultRandom(),
  projectId:         uuid('project_id').references(() => projects.projectId, { onDelete: 'cascade' }),
  taskId:            uuid('task_id').references(() => tasks.taskId, { onDelete: 'set null' }),
  commitSha:         varchar('commit_sha', { length: 40 }).notNull(),
  repoFullName:      varchar('repo_full_name', { length: 300 }).notNull(),
  message:           text('message').notNull(),
  messageHeadline:   varchar('message_headline', { length: 200 }).notNull(),
  authorName:        varchar('author_name', { length: 200 }),
  authorGithubLogin: varchar('author_github_login', { length: 100 }),
  authorUserId:      uuid('author_user_id').references(() => users.userId, { onDelete: 'set null' }),
  committedAt:       timestamp('committed_at', { withTimezone: true }).notNull(),
  branchName:        varchar('branch_name', { length: 200 }),
  url:               text('url'),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique('github_commits_repo_sha_unique').on(table.repoFullName, table.commitSha),
]);

// ─── github_ci_status ────────────────────────────────────────────────────────
export const githubCiStatus = pgTable('github_ci_status', {
  id:           uuid('id').primaryKey().defaultRandom(),
  projectId:    uuid('project_id').references(() => projects.projectId, { onDelete: 'cascade' }),
  workflowName: varchar('workflow_name', { length: 200 }),
  runId:        bigint('run_id', { mode: 'number' }).notNull(),
  status:       varchar('status', { length: 30 }).notNull(), // queued|in_progress|completed
  conclusion:   varchar('conclusion', { length: 30 }),       // success|failure|cancelled|skipped
  headBranch:   varchar('head_branch', { length: 200 }),
  headSha:      varchar('head_sha', { length: 40 }),
  htmlUrl:      text('html_url'),
  triggeredAt:  timestamp('triggered_at', { withTimezone: true }).notNull(),
  completedAt:  timestamp('completed_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const githubConnectionsRelations = relations(githubConnections, ({ one }) => ({
  project:   one(projects, { fields: [githubConnections.projectId], references: [projects.projectId] }),
  connector: one(users, { fields: [githubConnections.connectedBy], references: [users.userId] }),
}));

export const githubCommitsRelations = relations(githubCommits, ({ one }) => ({
  project:    one(projects, { fields: [githubCommits.projectId], references: [projects.projectId] }),
  task:       one(tasks, { fields: [githubCommits.taskId], references: [tasks.taskId] }),
  authorUser: one(users, { fields: [githubCommits.authorUserId], references: [users.userId] }),
}));

export const githubCiStatusRelations = relations(githubCiStatus, ({ one }) => ({
  project: one(projects, { fields: [githubCiStatus.projectId], references: [projects.projectId] }),
}));
