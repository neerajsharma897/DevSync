import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspaceRole, requireProjectRole } from '../../middleware/roles.js';
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
router.get('/:key', requireProjectRole(['project_admin', 'developer', 'viewer']), getProject);
router.patch('/:key', requireProjectRole(['project_admin', 'developer']), updateProject);
router.patch('/:key/archive', requireProjectRole(['project_admin']), archiveProject);

// ─── Project Member Management ───────────────────────────────────────────────
router.get('/:key/members', requireProjectRole(['project_admin', 'developer', 'viewer']), listProjectMembers);
router.post('/:key/members', requireProjectRole(['project_admin']), addProjectMember);
router.put('/:key/members/:userId', requireProjectRole(['project_admin']), updateProjectMemberRole);
router.delete('/:key/members/:userId', requireProjectRole(['project_admin']), removeProjectMember);

export default router;
