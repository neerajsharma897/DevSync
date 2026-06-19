import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { sprints, sprintTasks } from '../../db/schema/sprints.js';
import { tasks } from '../../db/schema/tasks.js';
import { eq, and, sql } from 'drizzle-orm';

// ─── CREATE SPRINT ───────────────────────────────────────────────────────────
// POST /api/projects/:projectId/sprints
export const createSprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const { name, goal, startDate, endDate } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Sprint name is required.' });
      return;
    }

    // Auto-generate sequence number
    const [lastSprint] = await db
      .select({ seq: sprints.sequenceNumber })
      .from(sprints)
      .where(eq(sprints.projectId, projectId))
      .orderBy(sql`sequence_number DESC`)
      .limit(1);

    const sequenceNumber = lastSprint ? lastSprint.seq + 1 : 1;

    const [sprint] = await db
      .insert(sprints)
      .values({
        projectId,
        name: name.trim(),
        goal: goal || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        sequenceNumber,
        status: 'future',
      })
      .returning();

    res.status(201).json({ message: 'Sprint created', sprint });
  } catch (err) {
    console.error('Create sprint error:', err);
    res.status(500).json({ error: 'Server error creating sprint.' });
  }
};

// ─── LIST SPRINTS ────────────────────────────────────────────────────────────
// GET /api/projects/:projectId/sprints
export const listSprints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;

    const results = await db
      .select()
      .from(sprints)
      .where(eq(sprints.projectId, projectId))
      .orderBy(sql`sequence_number ASC`);

    res.json({ sprints: results });
  } catch (err) {
    console.error('List sprints error:', err);
    res.status(500).json({ error: 'Server error listing sprints.' });
  }
};

// ─── START SPRINT ────────────────────────────────────────────────────────────
// PATCH /api/projects/:projectId/sprints/:sprintId/start
export const startSprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, sprintId } = req.params as Record<string, string>;
    const { startDate, endDate } = req.body;

    // Check no other sprint is active
    const [activeSprint] = await db
      .select({ sprintId: sprints.sprintId })
      .from(sprints)
      .where(and(eq(sprints.projectId, projectId), eq(sprints.status, 'active')))
      .limit(1);

    if (activeSprint) {
      res.status(409).json({ error: 'An active sprint already exists. Close it before starting a new one.' });
      return;
    }

    const [updated] = await db
      .update(sprints)
      .set({
        status: 'active',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(sprints.sprintId, sprintId), eq(sprints.status, 'future')))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Sprint not found or not in "future" status.' });
      return;
    }

    res.json({ message: 'Sprint started', sprint: updated });
  } catch (err) {
    console.error('Start sprint error:', err);
    res.status(500).json({ error: 'Server error starting sprint.' });
  }
};

// ─── CLOSE SPRINT ────────────────────────────────────────────────────────────
// PATCH /api/projects/:projectId/sprints/:sprintId/close
export const closeSprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params as Record<string, string>;
    const userId = req.user!.userId;

    // Get tasks in this sprint and count completed ones
    const sprintTaskList = await db
      .select({
        taskId: tasks.taskId,
        status: tasks.status,
      })
      .from(tasks)
      .where(eq(tasks.sprintId, sprintId));

    const completedCount = sprintTaskList.filter(t => t.status?.toUpperCase() === 'DONE').length;

    await db.transaction(async (tx) => {
      // 1. Close the sprint
      await tx
        .update(sprints)
        .set({
          status: 'closed',
          closedAt: new Date(),
          closedBy: userId,
          velocityIssues: completedCount,
          updatedAt: new Date(),
        })
        .where(eq(sprints.sprintId, sprintId));

      // 2. Record task completion status in sprint_tasks junction
      for (const task of sprintTaskList) {
        await tx.insert(sprintTasks).values({
          sprintId,
          taskId: task.taskId,
          wasCompletedInSprint: task.status?.toUpperCase() === 'DONE',
        }).onConflictDoNothing();
      }

      // 3. Move incomplete tasks back to backlog (clear sprintId)
      const incompleteTasks = sprintTaskList
        .filter(t => t.status?.toUpperCase() !== 'DONE')
        .map(t => t.taskId);

      if (incompleteTasks.length > 0) {
        for (const taskId of incompleteTasks) {
          await tx
            .update(tasks)
            .set({ sprintId: null, updatedAt: new Date() })
            .where(eq(tasks.taskId, taskId));
        }
      }
    });

    res.json({
      message: 'Sprint closed',
      stats: {
        totalTasks: sprintTaskList.length,
        completed: completedCount,
        incomplete: sprintTaskList.length - completedCount,
      },
    });
  } catch (err) {
    console.error('Close sprint error:', err);
    res.status(500).json({ error: 'Server error closing sprint.' });
  }
};

// ─── UPDATE SPRINT ───────────────────────────────────────────────────────────
// PATCH /api/projects/:projectId/sprints/:sprintId
export const updateSprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params as Record<string, string>;
    const { name, goal, startDate, endDate } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (goal !== undefined) updateData.goal = goal;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const [updated] = await db
      .update(sprints)
      .set(updateData)
      .where(eq(sprints.sprintId, sprintId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Sprint not found.' });
      return;
    }

    res.json({ message: 'Sprint updated', sprint: updated });
  } catch (err) {
    console.error('Update sprint error:', err);
    res.status(500).json({ error: 'Server error updating sprint.' });
  }
};

// ─── DELETE SPRINT ───────────────────────────────────────────────────────────
// DELETE /api/projects/:projectId/sprints/:sprintId
export const deleteSprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params as Record<string, string>;

    // Unlink all tasks from this sprint first
    await db
      .update(tasks)
      .set({ sprintId: null, updatedAt: new Date() })
      .where(eq(tasks.sprintId, sprintId));

    const [deleted] = await db
      .delete(sprints)
      .where(eq(sprints.sprintId, sprintId))
      .returning({ sprintId: sprints.sprintId });

    if (!deleted) {
      res.status(404).json({ error: 'Sprint not found.' });
      return;
    }

    res.json({ message: 'Sprint deleted' });
  } catch (err) {
    console.error('Delete sprint error:', err);
    res.status(500).json({ error: 'Server error deleting sprint.' });
  }
};

// ─── ADD TASK TO SPRINT ──────────────────────────────────────────────────────
// POST /api/workspaces/:slug/projects/:key/sprints/:sprintId/tasks
export const addTaskToSprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params as Record<string, string>;
    const { taskId } = req.body;

    if (!taskId) {
      res.status(400).json({ error: 'taskId is required.' });
      return;
    }

    // Verify the task exists
    const [task] = await db
      .select({ taskId: tasks.taskId })
      .from(tasks)
      .where(eq(tasks.taskId, taskId))
      .limit(1);

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    // Add to sprint_tasks junction and update task.sprint_id
    await db.transaction(async (tx) => {
      await tx.insert(sprintTasks).values({
        sprintId,
        taskId,
        wasCompletedInSprint: false,
      }).onConflictDoNothing();

      await tx
        .update(tasks)
        .set({ sprintId, updatedAt: new Date() })
        .where(eq(tasks.taskId, taskId));
    });

    res.status(201).json({ message: 'Task added to sprint' });
  } catch (err) {
    console.error('Add task to sprint error:', err);
    res.status(500).json({ error: 'Server error adding task to sprint.' });
  }
};

// ─── REMOVE TASK FROM SPRINT ─────────────────────────────────────────────────
// DELETE /api/workspaces/:slug/projects/:key/sprints/:sprintId/tasks/:taskId
export const removeTaskFromSprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sprintId, taskId } = req.params as Record<string, string>;

    await db.transaction(async (tx) => {
      await tx
        .delete(sprintTasks)
        .where(and(eq(sprintTasks.sprintId, sprintId), eq(sprintTasks.taskId, taskId)));

      await tx
        .update(tasks)
        .set({ sprintId: null, updatedAt: new Date() })
        .where(eq(tasks.taskId, taskId));
    });

    res.json({ message: 'Task removed from sprint' });
  } catch (err) {
    console.error('Remove task from sprint error:', err);
    res.status(500).json({ error: 'Server error removing task from sprint.' });
  }
};
