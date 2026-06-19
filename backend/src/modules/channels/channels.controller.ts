import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { channels, channelMembers } from '../../db/schema/channels.js';
import { workspaceMembers } from '../../db/schema/workspaces.js';
import { projectMembers } from '../../db/schema/projects.js';
import { users } from '../../db/schema/auth.js';
import { eq, and } from 'drizzle-orm';

// ─── Helper: generate slug from channel name ────────────────────────────────
const channelSlug = (name: string): string =>
  name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80);

// ─── CREATE CHANNEL ──────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/channels
export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const { name, description, type, projectId, isAnnouncementOnly, isDefault } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Channel name is required.' });
      return;
    }

    const channelType = type || 'public';
    if (!['public', 'private', 'dm', 'group_dm'].includes(channelType)) {
      res.status(400).json({ error: 'Type must be "public", "private", "dm", or "group_dm".' });
      return;
    }

    const slug = channelSlug(name);

    const result = await db.transaction(async (tx) => {
      const [channel] = await tx
        .insert(channels)
        .values({
          workspaceId,
          projectId: projectId || null,
          name: name.trim(),
          slug,
          description: description || null,
          type: channelType,
          isDefault: isDefault || false,
          isAnnouncementOnly: isAnnouncementOnly || false,
          createdBy: userId,
        })
        .returning();

      // Add creator as first member
      await tx.insert(channelMembers).values({
        channelId: channel.channelId,
        userId,
      });

      return channel;
    });

    res.status(201).json({ message: 'Channel created', channel: result });
  } catch (err) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: 'Server error creating channel.' });
  }
};

// ─── LIST CHANNELS IN WORKSPACE ──────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/channels
export const listChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const workspaceRole = req.workspaceRole; // from middleware

    const allChannels = await db
      .select()
      .from(channels)
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.isArchived, false)));

    // Fetch user's project memberships
    const userProjects = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));
    const userProjectIds = new Set(userProjects.map(p => p.projectId));

    // Fetch user's private channel memberships
    const userChannels = await db
      .select({ channelId: channelMembers.channelId })
      .from(channelMembers)
      .where(eq(channelMembers.userId, userId));
    const userChannelIds = new Set(userChannels.map(c => c.channelId));

    const visibleChannels = allChannels.filter(c => {
      if (c.projectId) {
        // Project-scoped channel
        if (workspaceRole === 'owner' || workspaceRole === 'admin') return true;
        return userProjectIds.has(c.projectId);
      } else {
        // Workspace-scoped channel
        if (c.type === 'public') return true;
        return userChannelIds.has(c.channelId);
      }
    });

    res.json({ channels: visibleChannels });
  } catch (err) {
    console.error('List channels error:', err);
    res.status(500).json({ error: 'Server error listing channels.' });
  }
};

// ─── GET SINGLE CHANNEL ─────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/channels/:channelId
export const getChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;

    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.channelId, channelId))
      .limit(1);

    if (!channel) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }

    const members = await db
      .select({
        userId: channelMembers.userId,
        joinedAt: channelMembers.joinedAt,
        fullName: users.fullName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        presence: users.presence,
      })
      .from(channelMembers)
      .innerJoin(users, eq(channelMembers.userId, users.userId))
      .where(eq(channelMembers.channelId, channelId));

    res.json({ channel, members });
  } catch (err) {
    console.error('Get channel error:', err);
    res.status(500).json({ error: 'Server error fetching channel.' });
  }
};

// ─── JOIN CHANNEL ────────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/channels/:channelId/join
export const joinChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;
    const userId = req.user!.userId;

    // Check if already a member
    const [existing] = await db
      .select({ id: channelMembers.id })
      .from(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: 'Already a member of this channel.' });
      return;
    }

    await db.insert(channelMembers).values({ channelId, userId });

    res.status(201).json({ message: 'Joined channel' });
  } catch (err) {
    console.error('Join channel error:', err);
    res.status(500).json({ error: 'Server error joining channel.' });
  }
};

// ─── LEAVE CHANNEL ───────────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/channels/:channelId/leave
export const leaveChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;
    const userId = req.user!.userId;

    const [removed] = await db
      .delete(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)))
      .returning({ id: channelMembers.id });

    if (!removed) {
      res.status(404).json({ error: 'Not a member of this channel.' });
      return;
    }

    res.json({ message: 'Left channel' });
  } catch (err) {
    console.error('Leave channel error:', err);
    res.status(500).json({ error: 'Server error leaving channel.' });
  }
};

// ─── ARCHIVE CHANNEL ─────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/channels/:channelId/archive
export const archiveChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;

    const [updated] = await db
      .update(channels)
      .set({ isArchived: true })
      .where(eq(channels.channelId, channelId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }

    res.json({ message: 'Channel archived', channel: updated });
  } catch (err) {
    console.error('Archive channel error:', err);
    res.status(500).json({ error: 'Server error archiving channel.' });
  }
};

// ─── DELETE CHANNEL ──────────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/channels/:channelId
export const deleteChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;

    const [deleted] = await db
      .delete(channels)
      .where(eq(channels.channelId, channelId))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }

    res.json({ message: 'Channel deleted successfully', channel: deleted });
  } catch (err) {
    console.error('Delete channel error:', err);
    res.status(500).json({ error: 'Server error deleting channel.' });
  }
};

// ─── UPDATE CHANNEL ──────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/channels/:channelId
export const updateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;
    const { name, description } = req.body;

    const updateData: any = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = channelSlug(name);
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const [updated] = await db
      .update(channels)
      .set(updateData)
      .where(eq(channels.channelId, channelId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }

    res.json({ message: 'Channel updated', channel: updated });
  } catch (err) {
    console.error('Update channel error:', err);
    res.status(500).json({ error: 'Server error updating channel.' });
  }
};
