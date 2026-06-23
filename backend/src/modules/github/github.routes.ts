import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireProjectRole, requireWorkspaceRole } from '../../middleware/roles.js';
import {
  connectGithubRepo,
  disconnectGithubRepo,
  getGithubConnection,
  getGithubCommits,
  getGithubCiRuns,
  getTaskCommits,
  handleGithubWebhook,
} from './github.controller.js';
import express from 'express';

// ─── Project-level routes for configuration ──────────────────────────────────
// Mounted at: /api/workspaces/:slug/projects/:key/github
export const githubConfigRouter = Router({ mergeParams: true });

githubConfigRouter.use(requireAuth);
githubConfigRouter.use(requireWorkspaceRole(['owner', 'admin', 'member']));
githubConfigRouter.get('/connection', requireProjectRole(['project_admin', 'developer', 'viewer']), getGithubConnection);
githubConfigRouter.post('/connect', requireProjectRole(['project_admin']), connectGithubRepo);
githubConfigRouter.delete('/disconnect', requireProjectRole(['project_admin']), disconnectGithubRepo);
githubConfigRouter.get('/commits', requireProjectRole(['project_admin', 'developer', 'viewer']), getGithubCommits);
githubConfigRouter.get('/ci', requireProjectRole(['project_admin', 'developer', 'viewer']), getGithubCiRuns);

// ─── Webhook routes for GitHub payloads ──────────────────────────────────────
// Mounted at: /api/webhooks/github
export const githubWebhookRouter = Router({ mergeParams: true });

// We need raw body for HMAC signature verification
githubWebhookRouter.post('/:projectId', express.raw({ type: 'application/json' }), handleGithubWebhook);

// ─── Task-level routes ───────────────────────────────────────────────────────
export const githubTaskRouter = Router({ mergeParams: true });
githubTaskRouter.use(requireAuth);
githubTaskRouter.get('/commits', requireProjectRole(['project_admin', 'developer', 'viewer']), getTaskCommits);
