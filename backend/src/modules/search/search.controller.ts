import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { sql } from 'drizzle-orm';
import { workspaceMembers } from '../../db/schema/workspaces.js';
import { projectMembers } from '../../db/schema/projects.js';
import { channelMembers } from '../../db/schema/channels.js';
import { eq, and, inArray, isNull, or, ilike, desc } from 'drizzle-orm';
import { tasks } from '../../db/schema/tasks.js';
import { messages } from '../../db/schema/channels.js';

// ─── FULL TEXT SEARCH (Tasks & Messages) ─────────────────────────────────────
// GET /api/search?q=search_term&workspaceId=uuid
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { q, workspaceId } = req.query as Record<string, string>;

    if (!q || q.trim().length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters.' });
      return;
    }

    // 1. If workspaceId is provided, verify the user is a member
    if (workspaceId) {
      const [wsMember] = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.state, 'active')
          )
        )
        .limit(1);

      if (!wsMember) {
        res.status(403).json({ error: 'You do not have access to this workspace.' });
        return;
      }
    }

    // 2. Fetch accessible Project IDs for Tasks
    const projectsSubquery = db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));
    
    const projectRecords = await projectsSubquery;
    const projectIds = projectRecords.map(p => p.projectId).filter((id): id is string => id !== null);

    // 3. Fetch accessible Channel IDs for Messages
    const channelsSubquery = db
      .select({ channelId: channelMembers.channelId })
      .from(channelMembers)
      .where(eq(channelMembers.userId, userId));

    const channelRecords = await channelsSubquery;
    const channelIds = channelRecords.map(c => c.channelId).filter((id): id is string => id !== null);

    // 4. Execute TSVECTOR Search using raw SQL
    const searchTerm = q.trim();

    // Drizzle doesn't officially support UNION across disparate raw SQL perfectly yet,
    // so we'll execute two separate raw queries and combine them.
    // Or we can use one raw SQL if we format it carefully.
    
    let taskResults: any[] = [];
    if (projectIds.length > 0) {
      const rawTasks = await db
        .select({
          id: tasks.taskId,
          taskKey: tasks.taskKey,
          title: tasks.title,
          rank: sql`(ts_rank(description_tsv, plainto_tsquery('english', ${searchTerm})) + (CASE WHEN title ILIKE '%' || ${searchTerm} || '%' THEN 1 ELSE 0 END))`
        })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            isNull(tasks.deletedAt),
            or(
              sql`description_tsv @@ plainto_tsquery('english', ${searchTerm})`,
              ilike(tasks.title, `%${searchTerm}%`)
            )
          )
        )
        .orderBy(desc(sql`rank`))
        .limit(20);

      taskResults = rawTasks.map(t => ({
        type: 'task',
        id: t.id,
        taskKey: t.taskKey,
        title: t.title,
        rank: Number(t.rank)
      }));
    }

    let messageResults: any[] = [];
    if (channelIds.length > 0) {
      const rawMessages = await db
        .select({
          id: messages.messageId,
          bodyText: messages.bodyText,
          rank: sql`(ts_rank(body_tsv, plainto_tsquery('english', ${searchTerm})) + (CASE WHEN body_text ILIKE '%' || ${searchTerm} || '%' THEN 1 ELSE 0 END))`
        })
        .from(messages)
        .where(
          and(
            inArray(messages.channelId, channelIds),
            eq(messages.isDeleted, false),
            or(
              sql`body_tsv @@ plainto_tsquery('english', ${searchTerm})`,
              ilike(messages.bodyText, `%${searchTerm}%`)
            )
          )
        )
        .orderBy(desc(sql`rank`))
        .limit(20);

      messageResults = rawMessages.map(m => ({
        type: 'message',
        id: m.id,
        bodyText: m.bodyText,
        rank: Number(m.rank)
      }));
    }

    // 5. Combine, sort, and return
    const combined = [...taskResults, ...messageResults].sort((a, b) => b.rank - a.rank).slice(0, 30);

    res.json({ results: combined });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error processing search.' });
  }
};
