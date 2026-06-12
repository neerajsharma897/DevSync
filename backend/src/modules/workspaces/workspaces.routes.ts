import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspaceRole } from '../../middleware/roles.js';
import {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  updateMemberRole,
  removeMember,
} from './workspaces.controller.js';

const router = Router();

// All workspace routes require authentication
router.use(requireAuth);

// ─── Workspace CRUD ──────────────────────────────────────────────────────────
router.post('/', createWorkspace);
router.get('/', listWorkspaces);
router.get('/:slug', requireWorkspaceRole(['owner', 'admin', 'member']), getWorkspace);
router.patch('/:slug', requireWorkspaceRole(['owner', 'admin']), updateWorkspace);
router.delete('/:slug', requireWorkspaceRole(['owner']), deleteWorkspace);

// ─── Member Management ──────────────────────────────────────────────────────
router.post('/:slug/invite', requireWorkspaceRole(['owner', 'admin']), inviteMember);
router.patch('/:slug/members/:userId', requireWorkspaceRole(['owner']), updateMemberRole);
router.delete('/:slug/members/:userId', requireWorkspaceRole(['owner', 'admin']), removeMember);

export default router;
