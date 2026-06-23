import { Router } from 'express';
import { getUploadUrl, getDownloadUrl } from './storage.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Protect storage routes so only authenticated users can upload/download
router.use(requireAuth);

router.post('/upload-url', getUploadUrl);
router.get('/download-url', getDownloadUrl);

export const storageRoutes = router;
