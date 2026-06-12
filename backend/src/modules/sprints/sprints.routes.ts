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
} from './sprints.controller.js';

// Mounted at /api/projects/:projectId/sprints
const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/', requireProjectRole(['project_admin']), createSprint);
router.get('/', requireProjectRole(['project_admin', 'developer', 'viewer']), listSprints);
router.patch('/:sprintId', requireProjectRole(['project_admin']), updateSprint);
router.patch('/:sprintId/start', requireProjectRole(['project_admin']), startSprint);
router.patch('/:sprintId/close', requireProjectRole(['project_admin']), closeSprint);
router.delete('/:sprintId', requireProjectRole(['project_admin']), deleteSprint);

export default router;
