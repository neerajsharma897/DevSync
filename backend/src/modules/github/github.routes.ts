import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireProjectRole } from '../../middleware/roles.js';
import {
  connectGithubRepo,
  disconnectGithubRepo,
  getGithubCommits,
  getGithubCiRuns,
  handleGithubWebhook,
} from './github.controller.js';
import express from 'express';

// ─── Project-level routes for configuration ──────────────────────────────────
// Mounted at: /api/workspaces/:slug/projects/:key/github
export const githubConfigRouter = Router({ mergeParams: true });

githubConfigRouter.use(requireAuth);
githubConfigRouter.post('/connect', requireProjectRole(['project_admin']), connectGithubRepo);
githubConfigRouter.delete('/disconnect', requireProjectRole(['project_admin']), disconnectGithubRepo);
githubConfigRouter.get('/commits', requireProjectRole(['project_admin', 'developer', 'viewer']), getGithubCommits);
githubConfigRouter.get('/ci', requireProjectRole(['project_admin', 'developer', 'viewer']), getGithubCiRuns);

// ─── Webhook routes for GitHub payloads ──────────────────────────────────────
// Mounted at: /api/webhooks/github
export const githubWebhookRouter = Router();

// We need raw body or standard json for webhook parsing
// Note: verifySignature in controller assumes req.body is accessible and signature matches JSON.stringify(req.body).
// In production, you might want to use a custom middleware to preserve req.rawBody.
githubWebhookRouter.post('/', express.json(), handleGithubWebhook);
