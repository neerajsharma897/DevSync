import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspaceRole } from '../../middleware/roles.js';
import { getUploadUrl, getDownloadUrl } from './files.controller.js';

// Mounted at: /api/workspaces/:workspaceId/files
const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspaceRole(['owner', 'admin', 'member']));

router.post('/upload-url', getUploadUrl);
router.get('/:fileId/download', getDownloadUrl);

export default router;
