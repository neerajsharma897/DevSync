import { Request, Response } from 'express';
import { supabase } from '../../config/supabase.js';

export const getUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bucket, filename } = req.body;

    if (!bucket || !filename) {
      res.status(400).json({ error: 'Bucket and filename are required.' });
      return;
    }

    // Ensure the filename is unique to prevent overwriting
    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${req.user?.userId}/${uniqueFilename}`;

    // Create a signed upload URL valid for 5 minutes
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Supabase Storage Error:', error);
      res.status(500).json({ error: 'Failed to generate upload URL.' });
      return;
    }

    // Return the signed URL and the final public/retrieval path
    res.json({
      uploadUrl: data.signedUrl,
      path: filePath,
      fullPath: `${bucket}/${filePath}`,
    });
  } catch (err) {
    console.error('Storage Controller Error:', err);
    res.status(500).json({ error: 'Server error generating upload URL.' });
  }
};

export const getDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bucket, path } = req.query;

    if (!bucket || !path) {
      res.status(400).json({ error: 'Bucket and path query parameters are required.' });
      return;
    }

    // Generate a signed URL for reading the file, valid for 1 hour
    const { data, error } = await supabase.storage
      .from(bucket as string)
      .createSignedUrl(path as string, 3600);

    if (error) {
      console.error('Supabase Storage Error:', error);
      res.status(404).json({ error: 'File not found or access denied.' });
      return;
    }

    res.json({ url: data.signedUrl });
  } catch (err) {
    console.error('Storage Controller Error:', err);
    res.status(500).json({ error: 'Server error generating download URL.' });
  }
};
