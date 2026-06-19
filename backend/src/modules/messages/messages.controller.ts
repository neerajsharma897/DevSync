import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { messages } from '../../db/schema/channels.js';
import { users } from '../../db/schema/auth.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { getIO } from '../../sockets/index.js';

// ─── SEND MESSAGE ────────────────────────────────────────────────────────────
// POST /api/channels/:channelId/messages
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const { bodyText, bodyBlocks, threadId, isSystem, systemType } = req.body;

    if (!bodyText && !bodyBlocks) {
      res.status(400).json({ error: 'Message body cannot be empty.' });
      return;
    }

    const result = await db.transaction(async (tx) => {
      // 1. Insert message
      const [message] = await tx
        .insert(messages)
        .values({
          channelId,
          authorId: userId,
          bodyText: bodyText || '',
          bodyBlocks: bodyBlocks || null,
          threadId: threadId || null,
          isSystem: isSystem || false,
          systemType: systemType || null,
        })
        .returning();

      // 2. If it's a thread reply, increment parent's replyCount
      if (threadId) {
        await tx
          .update(messages)
          .set({ replyCount: sql`reply_count + 1`, updatedAt: new Date() })
          .where(eq(messages.messageId, threadId));
      }

      return message;
    });

    // Fetch author details to populate the real-time event
    const [author] = await db
      .select({ fullName: users.fullName, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    const populatedMessage = {
      ...result,
      authorName: author?.fullName,
      authorAvatar: author?.avatarUrl,
    };

    // Emit real-time event
    const io = getIO();
    io.to(`channel:${channelId}`).emit('new_message', populatedMessage);

    res.status(201).json({ message: 'Message sent', data: populatedMessage });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Server error sending message.' });
  }
};

// ─── LIST MESSAGES (CHANNEL) ─────────────────────────────────────────────────
// GET /api/channels/:channelId/messages
export const listMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as Record<string, string>;
    const { limit = 50, cursor } = req.query;

    const parsedLimit = Math.min(parseInt(limit as string, 10) || 50, 100);

    // Basic cursor-based pagination (using createdAt) could be added,
    // but for simplicity we fetch the latest N messages that are NOT in a thread.
    // Thread replies are fetched separately.
    const results = await db
      .select({
        messageId: messages.messageId,
        bodyText: messages.bodyText,
        bodyBlocks: messages.bodyBlocks,
        isSystem: messages.isSystem,
        systemType: messages.systemType,
        isEdited: messages.isEdited,
        isDeleted: messages.isDeleted,
        isPinned: messages.isPinned,
        replyCount: messages.replyCount,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        authorId: users.userId,
        authorName: users.fullName,
        authorAvatar: users.avatarUrl,
      })
      .from(messages)
      .leftJoin(users, eq(messages.authorId, users.userId))
      .where(
        and(
          eq(messages.channelId, channelId),
          sql`${messages.threadId} IS NULL`
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(parsedLimit);

    res.json({ messages: results.reverse() }); // Reverse so oldest is first for UI display
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({ error: 'Server error listing messages.' });
  }
};

// ─── GET THREAD REPLIES ──────────────────────────────────────────────────────
// GET /api/channels/:channelId/messages/:messageId/thread
export const getThreadReplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params as Record<string, string>;

    const results = await db
      .select({
        messageId: messages.messageId,
        bodyText: messages.bodyText,
        bodyBlocks: messages.bodyBlocks,
        isEdited: messages.isEdited,
        isDeleted: messages.isDeleted,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        authorId: users.userId,
        authorName: users.fullName,
        authorAvatar: users.avatarUrl,
      })
      .from(messages)
      .leftJoin(users, eq(messages.authorId, users.userId))
      .where(eq(messages.threadId, messageId))
      .orderBy(asc(messages.createdAt)); // Chronological order for threads

    res.json({ replies: results });
  } catch (err) {
    console.error('Get thread error:', err);
    res.status(500).json({ error: 'Server error fetching thread replies.' });
  }
};

// ─── EDIT MESSAGE ────────────────────────────────────────────────────────────
// PATCH /api/channels/:channelId/messages/:messageId
export const editMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const { bodyText, bodyBlocks, isPinned } = req.body;

    // Verify ownership before editing text
    const [msg] = await db
      .select({ authorId: messages.authorId, isDeleted: messages.isDeleted })
      .from(messages)
      .where(eq(messages.messageId, messageId))
      .limit(1);

    if (!msg) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    if (msg.isDeleted) {
      res.status(400).json({ error: 'Cannot edit a deleted message.' });
      return;
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    
    // Only author can edit content
    if (bodyText !== undefined || bodyBlocks !== undefined) {
      if (msg.authorId !== userId) {
        res.status(403).json({ error: 'You can only edit your own messages.' });
        return;
      }
      if (bodyText !== undefined) updateData.bodyText = bodyText;
      if (bodyBlocks !== undefined) updateData.bodyBlocks = bodyBlocks;
      updateData.isEdited = true;
    }

    // Anyone with access to the route (channel members) can pin/unpin for now
    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    const [updated] = await db
      .update(messages)
      .set(updateData)
      .where(eq(messages.messageId, messageId))
      .returning();

    // Emit real-time event
    const io = getIO();
    io.to(`channel:${channelId}`).emit('message_updated', updated);

    res.json({ message: 'Message updated', data: updated });
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(500).json({ error: 'Server error editing message.' });
  }
};

// ─── SOFT DELETE MESSAGE ─────────────────────────────────────────────────────
// DELETE /api/channels/:channelId/messages/:messageId
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId, messageId } = req.params as Record<string, string>;
    const userId = req.user!.userId;

    // Verify ownership
    const [msg] = await db
      .select({ authorId: messages.authorId, threadId: messages.threadId })
      .from(messages)
      .where(eq(messages.messageId, messageId))
      .limit(1);

    if (!msg) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    if (msg.authorId !== userId) {
      res.status(403).json({ error: 'You can only delete your own messages.' });
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(messages)
        .set({
          isDeleted: true,
          bodyText: 'This message was deleted.',
          bodyBlocks: null,
          updatedAt: new Date(),
        })
        .where(eq(messages.messageId, messageId));

      // Optional: If it was a reply, we could decrement the parent's replyCount,
      // but keeping it is also valid for auditing. We'll leave the count as is.
    });

    // Emit real-time event
    const io = getIO();
    io.to(`channel:${channelId}`).emit('message_deleted', { messageId });

    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Server error deleting message.' });
  }
};
