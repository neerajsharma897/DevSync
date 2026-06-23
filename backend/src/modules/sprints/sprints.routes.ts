import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireProjectRole } from '../../middleware/roles.js';
import {
  createSprint,
  listSprints,
  startSprint,
  closeSprint,
  updateSprint,
  deleteSprint,
  addTaskToSprint,
  removeTaskFromSprint,
} from './sprints.controller.js';

// Mounted at /api/workspaces/:slug/projects/:key/sprints
const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/', requireProjectRole(['project_admin']), createSprint);
router.get('/', requireProjectRole(['project_admin', 'developer', 'viewer']), listSprints);
router.patch('/:sprintId', requireProjectRole(['project_admin']), updateSprint);
router.patch('/:sprintId/start', requireProjectRole(['project_admin']), startSprint);
router.patch('/:sprintId/close', requireProjectRole(['project_admin']), closeSprint);
router.delete('/:sprintId', requireProjectRole(['project_admin']), deleteSprint);

// ─── Sprint-Task Management ──────────────────────────────────────────────────
router.post('/:sprintId/tasks', requireProjectRole(['project_admin', 'developer']), addTaskToSprint);
router.delete('/:sprintId/tasks/:taskId', requireProjectRole(['project_admin', 'developer']), removeTaskFromSprint);

export default router;
