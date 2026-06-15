import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspaceRole } from '../../middleware/roles.js';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  archiveProject,
  listProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from './projects.controller.js';
import { resolveProjectKey } from '../../middleware/slugs.js';

// Mounted at /api/workspaces/:slug/projects
const router = Router({ mergeParams: true });

// Register param resolver for key
router.param('key', resolveProjectKey);

// All project routes require auth + workspace membership
router.use(requireAuth);
router.use(requireWorkspaceRole(['owner', 'admin', 'member']));

// ─── Project CRUD ────────────────────────────────────────────────────────────
router.post('/', createProject);
router.get('/', listProjects);
router.get('/:key', getProject);
router.patch('/:key', updateProject);
router.patch('/:key/archive', archiveProject);

// ─── Project Member Management ───────────────────────────────────────────────
router.get('/:key/members', listProjectMembers);
router.post('/:key/members', addProjectMember);
router.put('/:key/members/:userId', updateProjectMemberRole);
router.delete('/:key/members/:userId', removeProjectMember);

export default router;
