import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { workspaceFiles } from '../../db/schema/channels.js';
import { eq, desc } from 'drizzle-orm';
import { supabase } from '../../config/supabase.js';

// Since we are using Supabase, we can use the Supabase Storage JS client
// to generate presigned URLs.

// ─── GET PRESIGNED UPLOAD URL ────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/files/upload-url
export const getUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const { filename, mimetype, sizeBytes, filetype } = req.body;

    if (!filename) {
      res.status(400).json({ error: 'Filename is required.' });
      return;
    }



    // Define unique path in storage bucket
    const fileExt = filename.split('.').pop() || '';
    const safeName = filename.replace(/[^a-zA-Z0-9-_\.]/g, '');
    const storagePath = `workspaces/${workspaceId}/${Date.now()}_${safeName}`;

    // Create record in DB
    const [fileRecord] = await db
      .insert(workspaceFiles)
      .values({
        workspaceId,
        uploaderId: userId,
        filename,
        storagePath,
        mimetype: mimetype || null,
        sizeBytes: sizeBytes || null,
        filetype: filetype || 'other',
      })
      .returning();

    // Create presigned URL for direct upload from frontend
    const { data, error } = await supabase.storage
      .from('workspace-files') // Must create this bucket in Supabase UI
      .createSignedUploadUrl(storagePath);

    if (error) {
      throw error;
    }

    res.status(200).json({
      uploadUrl: data.signedUrl,
      fileRecord,
    });
  } catch (err) {
    console.error('Get upload URL error:', err);
    res.status(500).json({ error: 'Server error generating upload URL.' });
  }
};

// ─── GET PRESIGNED DOWNLOAD URL ──────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/files/:fileId/download
export const getDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params as Record<string, string>;

    const [fileRecord] = await db
      .select()
      .from(workspaceFiles)
      .where(eq(workspaceFiles.fileId, fileId))
      .limit(1);

    if (!fileRecord) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const { data, error } = await supabase.storage
      .from('workspace-files')
      .createSignedUrl(fileRecord.storagePath, 3600); // 1 hour expiry

    if (error) {
      throw error;
    }

    res.json({ downloadUrl: data.signedUrl, fileRecord });
  } catch (err) {
    console.error('Get download URL error:', err);
    res.status(500).json({ error: 'Server error generating download URL.' });
  }
};
