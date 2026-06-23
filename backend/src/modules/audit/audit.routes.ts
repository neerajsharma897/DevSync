import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getEntityAuditLogs } from './audit.controller.js';

const router = Router();

router.use(requireAuth);

// Optional: you can add a role verification middleware here or inside the controller
// to ensure the user has access to the entity they are querying logs for.
router.get('/:entityType/:entityId', getEntityAuditLogs);

export default router;
