import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspaceRole } from '../../middleware/roles.js';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  addProjectMember,
  removeProjectMember,
} from './projects.controller.js';

// Mounted at /api/workspaces/:workspaceId/projects
const router = Router({ mergeParams: true });

// All project routes require auth + workspace membership
router.use(requireAuth);
router.use(requireWorkspaceRole(['owner', 'admin', 'member']));

// ─── Project CRUD ────────────────────────────────────────────────────────────
router.post('/', createProject);
router.get('/', listProjects);
router.get('/:key', getProject);
router.patch('/:key', updateProject);

// ─── Project Member Management ───────────────────────────────────────────────
router.post('/:key/members', addProjectMember);
router.delete('/:key/members/:userId', removeProjectMember);

export default router;
