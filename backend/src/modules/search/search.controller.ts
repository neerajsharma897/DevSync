import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { sql } from 'drizzle-orm';
import { workspaceMembers } from '../../db/schema/workspaces.js';
import { projectMembers } from '../../db/schema/projects.js';
import { channelMembers } from '../../db/schema/channels.js';
import { eq, and } from 'drizzle-orm';

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
    const projectIds = projectRecords.map(p => p.projectId);

    // 3. Fetch accessible Channel IDs for Messages
    const channelsSubquery = db
      .select({ channelId: channelMembers.channelId })
      .from(channelMembers)
      .where(eq(channelMembers.userId, userId));

    const channelRecords = await channelsSubquery;
    const channelIds = channelRecords.map(c => c.channelId);

    // 4. Execute TSVECTOR Search using raw SQL
    const searchTerm = q.trim();

    // Drizzle doesn't officially support UNION across disparate raw SQL perfectly yet,
    // so we'll execute two separate raw queries and combine them.
    // Or we can use one raw SQL if we format it carefully.
    
    let taskResults: any[] = [];
    if (projectIds.length > 0) {
      const tasksQuery = sql`
        SELECT 'task' as type, task_id as id, task_key as "taskKey", title,
               ts_rank(description_tsv, plainto_tsquery('english', ${searchTerm})) as rank
        FROM tasks
        WHERE description_tsv @@ plainto_tsquery('english', ${searchTerm})
          AND project_id = ANY(${projectIds})
          AND deleted_at IS NULL
        ORDER BY rank DESC
        LIMIT 20
      `;
      const tasksRes = await db.execute(tasksQuery);
      taskResults = tasksRes;
    }

    let messageResults: any[] = [];
    if (channelIds.length > 0) {
      const messagesQuery = sql`
        SELECT 'message' as type, message_id as id, body_text as "bodyText",
               ts_rank(body_tsv, plainto_tsquery('english', ${searchTerm})) as rank
        FROM messages
        WHERE body_tsv @@ plainto_tsquery('english', ${searchTerm})
          AND channel_id = ANY(${channelIds})
          AND is_deleted = false
        ORDER BY rank DESC
        LIMIT 20
      `;
      const messagesRes = await db.execute(messagesQuery);
      messageResults = messagesRes;
    }

    // 5. Combine, sort, and return
    const combined = [...taskResults, ...messageResults].sort((a, b) => b.rank - a.rank).slice(0, 30);

    res.json({ results: combined });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error processing search.' });
  }
};
