import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireProjectRole } from '../../middleware/roles.js';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  reorderTask,
  deleteTask,
} from './tasks.controller.js';

// Mounted at /api/projects/:projectId/tasks
const router = Router({ mergeParams: true });

// All task routes require auth + project membership
router.use(requireAuth);

// ─── Task CRUD ───────────────────────────────────────────────────────────────
router.post('/', requireProjectRole(['project_admin', 'developer']), createTask);
router.get('/', requireProjectRole(['project_admin', 'developer', 'viewer']), listTasks);
router.get('/:taskKey', requireProjectRole(['project_admin', 'developer', 'viewer']), getTask);
router.patch('/:taskKey', requireProjectRole(['project_admin', 'developer']), updateTask);
router.patch('/:taskKey/reorder', requireProjectRole(['project_admin', 'developer']), reorderTask);
router.delete('/:taskKey', requireProjectRole(['project_admin']), deleteTask);

export default router;
