import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { notifications } from '../../db/schema/notifications.js';
import { users } from '../../db/schema/auth.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getIO } from '../../sockets/index.js';

// ─── INTERNAL HELPER: Create a notification ──────────────────────────────────
export const createNotification = async (params: {
  recipientId: string;
  actorId?: string;
  type: string;
  entityType: string;
  entityId: string;
  title?: string;
  body?: string;
}) => {
  try {
    // Don't notify oneself
    if (params.actorId && params.actorId === params.recipientId) {
      return null;
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        recipientId: params.recipientId,
        actorId: params.actorId || null,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        title: params.title || null,
        body: params.body || null,
      })
      .returning();

    // Emit real-time event to the recipient
    const io = getIO();
    io.to(`user:${params.recipientId}`).emit('new_notification', notification);

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

// ─── GET MY NOTIFICATIONS ────────────────────────────────────────────────────
// GET /api/notifications
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { unreadOnly, limit = 50 } = req.query;

    const parsedLimit = Math.min(parseInt(limit as string, 10) || 50, 100);

    let conditions = [eq(notifications.recipientId, userId)];
    
    if (unreadOnly === 'true') {
      conditions.push(eq(notifications.isRead, false));
    }

    const results = await db
      .select({
        notificationId: notifications.notificationId,
        type: notifications.type,
        entityType: notifications.entityType,
        entityId: notifications.entityId,
        title: notifications.title,
        body: notifications.body,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
        actorId: users.userId,
        actorName: users.fullName,
        actorAvatar: users.avatarUrl,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.userId))
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(parsedLimit);

    res.json({ notifications: results });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server error fetching notifications.' });
  }
};

// ─── MARK AS READ ────────────────────────────────────────────────────────────
// PATCH /api/notifications/:notificationId/read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params as Record<string, string>;
    const userId = req.user!.userId;

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.notificationId, notificationId),
          eq(notifications.recipientId, userId)
        )
      )
      .returning({ notificationId: notifications.notificationId });

    if (!updated) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ error: 'Server error marking notification as read.' });
  }
};

// ─── MARK ALL AS READ ────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.isRead, false)
        )
      );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ error: 'Server error marking all notifications as read.' });
  }
};
