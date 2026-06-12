import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspaceRole } from '../../middleware/roles.js';
import {
  createChannel,
  listChannels,
  getChannel,
  joinChannel,
  leaveChannel,
  archiveChannel,
} from './channels.controller.js';

// Mounted at /api/workspaces/:workspaceId/channels
const router = Router({ mergeParams: true });

// All channel routes require auth + workspace membership
router.use(requireAuth);
router.use(requireWorkspaceRole(['owner', 'admin', 'member']));

// ─── Channel Management ──────────────────────────────────────────────────────
router.post('/', requireWorkspaceRole(['owner', 'admin']), createChannel);
router.get('/', listChannels);
router.get('/:channelId', getChannel);
router.post('/:channelId/join', joinChannel);
router.delete('/:channelId/leave', leaveChannel);
router.patch('/:channelId/archive', requireWorkspaceRole(['owner', 'admin']), archiveChannel);

export default router;
