import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { tasks } from '../../db/schema/tasks.js';
import { projects, projectMembers } from '../../db/schema/projects.js';
import { users } from '../../db/schema/auth.js';
import { messages } from '../../db/schema/channels.js';
import { eq, and, isNull, asc, desc, sql, or, ilike } from 'drizzle-orm';

// ─── Lexorank helpers ────────────────────────────────────────────────────────
// Simplified mid-string calculation for board ordering
const midRank = (a: string, b: string): string => {
  const pad = Math.max(a.length, b.length);
  const aa = a.padEnd(pad, 'a');
  const bb = b.padEnd(pad, 'z');
  let result = '';
  for (let i = 0; i < pad; i++) {
    const mid = Math.floor((aa.charCodeAt(i) + bb.charCodeAt(i)) / 2);
    result += String.fromCharCode(mid);
  }
  if (result === aa) result += 'n'; // midpoint between identical strings
  return result;
};

const RANK_FIRST = 'aaaaaa';
const RANK_GAP = 'n';

// ─── CREATE TASK ─────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/tasks
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const {
      title, description, descriptionText, issueType,
      status, priority, assigneeId, dueDate, labels,
      parentTaskId, epicId, sprintId,
    } = req.body;

    if (!title || title.trim().length < 1) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }

    const result = await db.transaction(async (tx) => {
      // 1. Atomically increment the project's issue counter to generate task key
      const [project] = await tx
        .update(projects)
        .set({ issueCounter: sql`issue_counter + 1`, updatedAt: new Date() })
        .where(eq(projects.projectId, projectId))
        .returning({ issueCounter: projects.issueCounter, key: projects.key });

      if (!project) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      const taskKey = `${project.key}-${project.issueCounter}`;

      // 2. Determine rank — place at end of the target status column
      const targetStatus = status || 'todo';
      const [lastTask] = await tx
        .select({ rank: tasks.rank })
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, projectId),
            eq(tasks.status, targetStatus),
            isNull(tasks.deletedAt)
          )
        )
        .orderBy(desc(tasks.rank))
        .limit(1);

      let rank: string;
      if (!lastTask || !lastTask.rank) {
        rank = RANK_FIRST;
      } else {
        rank = lastTask.rank + RANK_GAP;
      }

      // 3. Create the root message for the task's discussion thread
      const [rootMessage] = await tx
        .insert(messages)
        .values({
          authorId: userId,
          isSystem: true,
          systemType: 'task_thread_root',
          bodyText: `Task thread root for ${taskKey}`,
        })
        .returning();

      // 4. Create the system message "User created this task"
      const [creator] = await tx.select({ fullName: users.fullName }).from(users).where(eq(users.userId, userId));
      await tx.insert(messages).values({
        authorId: userId,
        isSystem: true,
        systemType: 'task_created',
        bodyText: `${creator?.fullName || 'System'} created this task`,
        threadId: rootMessage.messageId,
      });

      // 5. Insert the task
      const [task] = await tx
        .insert(tasks)
        .values({
          taskKey,
          projectId,
          title: title.trim(),
          description: description || {},
          descriptionText: descriptionText || '',
          issueType: issueType || 'task',
          status: targetStatus,
          priority: priority || 'medium',
          reporterId: userId,
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          labels: labels || [],
          rank,
          parentTaskId: parentTaskId || null,
          epicId: epicId || null,
          sprintId: sprintId || null,
          discussionThreadId: rootMessage.messageId,
        })
        .returning();

      return task;
    });

    res.status(201).json({ message: 'Task created', task: result });
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error creating task.' });
  }
};

// ─── LIST TASKS (Board View) ─────────────────────────────────────────────────
// GET /api/projects/:projectId/tasks
export const listTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const { status, assigneeId, sprintId, issueType, search } = req.query;

    let conditions = [eq(tasks.projectId, projectId), isNull(tasks.deletedAt)];

    if (status && typeof status === 'string') {
      conditions.push(eq(tasks.status, status));
    }
    if (assigneeId && typeof assigneeId === 'string') {
      conditions.push(eq(tasks.assigneeId, assigneeId));
    }
    if (sprintId && typeof sprintId === 'string') {
      conditions.push(eq(tasks.sprintId, sprintId));
    }
    if (issueType && typeof issueType === 'string') {
      conditions.push(eq(tasks.issueType, issueType));
    }

    // Build WHERE clause
    let whereClause = and(...conditions);

    // Text search using ILIKE on title (simple), or TSVECTOR for description
    if (search && typeof search === 'string') {
      const searchCondition = or(
        ilike(tasks.title, `%${search}%`),
        ilike(tasks.descriptionText, `%${search}%`)
      );
      whereClause = and(whereClause, searchCondition);
    }

    const results = await db
      .select({
        taskId: tasks.taskId,
        taskKey: tasks.taskKey,
        title: tasks.title,
        issueType: tasks.issueType,
        status: tasks.status,
        priority: tasks.priority,
        rank: tasks.rank,
        dueDate: tasks.dueDate,
        labels: tasks.labels,
        sprintId: tasks.sprintId,
        assigneeId: tasks.assigneeId,
        assigneeName: users.fullName,
        assigneeAvatar: users.avatarUrl,
        reporterId: tasks.reporterId,
        linkedCommitsCount: tasks.linkedCommitsCount,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.userId))
      .where(whereClause)
      .orderBy(asc(tasks.rank));

    res.json({ tasks: results });
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Server error listing tasks.' });
  }
};

// ─── GET SINGLE TASK ─────────────────────────────────────────────────────────
// GET /api/projects/:projectId/tasks/:taskId
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = req.params.taskId || res.locals.taskId;

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskId, taskId), isNull(tasks.deletedAt)))
      .limit(1);

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ task });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Server error fetching task.' });
  }
};

// ─── UPDATE TASK ─────────────────────────────────────────────────────────────
// PATCH /api/projects/:projectId/tasks/:taskId
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = req.params.taskId || res.locals.taskId;
    const {
      title, description, descriptionText, issueType,
      status, priority, assigneeId, dueDate, labels,
      parentTaskId, epicId, sprintId,
    } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (descriptionText !== undefined) updateData.descriptionText = descriptionText;
    if (issueType !== undefined) updateData.issueType = issueType;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (labels !== undefined) updateData.labels = labels;
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId || null;
    if (epicId !== undefined) updateData.epicId = epicId || null;
    if (sprintId !== undefined) updateData.sprintId = sprintId || null;

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.taskId, taskId), isNull(tasks.deletedAt)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ message: 'Task updated', task: updated });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error updating task.' });
  }
};

// ─── REORDER TASK (Drag & Drop) ──────────────────────────────────────────────
// PATCH /api/projects/:projectId/tasks/:taskId/reorder
export const reorderTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = req.params.taskId || res.locals.taskId;
    const { status, afterTaskId, beforeTaskId } = req.body;

    // Get ranks of surrounding tasks to calculate new rank
    let afterRank = '';
    let beforeRank = '';

    if (afterTaskId) {
      const [after] = await db
        .select({ rank: tasks.rank })
        .from(tasks)
        .where(eq(tasks.taskId, afterTaskId))
        .limit(1);
      if (after?.rank) afterRank = after.rank;
    }

    if (beforeTaskId) {
      const [before] = await db
        .select({ rank: tasks.rank })
        .from(tasks)
        .where(eq(tasks.taskId, beforeTaskId))
        .limit(1);
      if (before?.rank) beforeRank = before.rank;
    }

    let newRank: string;
    if (afterRank && beforeRank) {
      newRank = midRank(afterRank, beforeRank);
    } else if (afterRank) {
      newRank = afterRank + RANK_GAP;
    } else if (beforeRank) {
      newRank = midRank(RANK_FIRST, beforeRank);
    } else {
      newRank = RANK_FIRST;
    }

    const updateData: Record<string, any> = { rank: newRank, updatedAt: new Date() };
    if (status) updateData.status = status;

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.taskId, taskId))
      .returning({ taskId: tasks.taskId, rank: tasks.rank, status: tasks.status });

    if (!updated) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ message: 'Task reordered', task: updated });
  } catch (err) {
    console.error('Reorder task error:', err);
    res.status(500).json({ error: 'Server error reordering task.' });
  }
};

// ─── SOFT DELETE TASK ────────────────────────────────────────────────────────
// DELETE /api/projects/:projectId/tasks/:taskId
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = req.params.taskId || res.locals.taskId;

    const [deleted] = await db
      .update(tasks)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(tasks.taskId, taskId), isNull(tasks.deletedAt)))
      .returning({ taskId: tasks.taskId });

    if (!deleted) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error deleting task.', details: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
  }
};

// ─── GET TASK COMMENTS (Using Messages Thread) ─────────────────────────────────
// GET /api/projects/:projectId/tasks/:taskKey/comments
export const getTaskComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = res.locals.taskId;

    // Fetch the task to get its discussionThreadId
    const [task] = await db.select({ discussionThreadId: tasks.discussionThreadId }).from(tasks).where(eq(tasks.taskId, taskId));
    
    if (!task || !task.discussionThreadId) {
      res.json({ comments: [] });
      return;
    }

    const comments = await db
      .select({
        commentId: messages.messageId,
        threadId: messages.threadId,
        bodyText: messages.bodyText,
        createdAt: messages.createdAt,
        isSystem: messages.isSystem,
        systemType: messages.systemType,
        authorId: users.userId,
        authorName: users.fullName,
      })
      .from(messages)
      .leftJoin(users, eq(users.userId, messages.authorId))
      .where(eq(messages.threadId, task.discussionThreadId))
      .orderBy(asc(messages.createdAt));

    res.json({ comments });
  } catch (err) {
    console.error('Get task comments error:', err);
    res.status(500).json({ error: 'Server error fetching comments.' });
  }
};

// ─── CREATE TASK COMMENT (Using Messages Thread) ───────────────────────────────
// POST /api/projects/:projectId/tasks/:taskKey/comments
export const createTaskComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = res.locals.taskId;
    const userId = req.user!.userId;
    const { bodyText } = req.body;

    if (!bodyText || bodyText.trim().length === 0) {
      res.status(400).json({ error: 'Comment body cannot be empty.' });
      return;
    }

    // Fetch the task to get its discussionThreadId
    const [task] = await db.select({ discussionThreadId: tasks.discussionThreadId }).from(tasks).where(eq(tasks.taskId, taskId));
    
    if (!task || !task.discussionThreadId) {
      res.status(400).json({ error: 'Task does not have a discussion thread.' });
      return;
    }

    const [comment] = await db
      .insert(messages)
      .values({
        threadId: task.discussionThreadId,
        authorId: userId,
        bodyText,
        isSystem: false,
      })
      .returning();

    // Fetch author details to return in the response
    const [author] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.userId, userId));

    res.status(201).json({
      comment: {
        commentId: comment.messageId,
        threadId: comment.threadId,
        bodyText: comment.bodyText,
        createdAt: comment.createdAt,
        isSystem: comment.isSystem,
        systemType: comment.systemType,
        authorId: comment.authorId,
        authorName: author?.fullName,
      }
    });
  } catch (err) {
    console.error('Create task comment error:', err);
    res.status(500).json({ error: 'Server error creating comment.' });
  }
};
