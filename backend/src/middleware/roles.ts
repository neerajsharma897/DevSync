import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import { workspaceMembers } from '../db/schema/workspaces.js';
import { projectMembers } from '../db/schema/projects.js';
import { and, eq, inArray } from 'drizzle-orm';

// Extend Express Request interface to store roles context
declare global {
  namespace Express {
    interface Request {
      workspaceRole?: string;
      projectRole?: string;
    }
  }
}

/**
 * Middleware to restrict access based on Workspace-level roles.
 * Requires requireAuth to run first to populate req.user.
 */
export const requireWorkspaceRole = (allowedRoles: ('owner' | 'admin' | 'member')[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized. Auth context missing.' });
        return;
      }

      if (!workspaceId || typeof workspaceId !== 'string') {
        res.status(400).json({ error: 'workspaceId is required for this action.' });
        return;
      }

      // Check membership and role
      const [membership] = await db
        .select({
          role: workspaceMembers.role,
          state: workspaceMembers.state,
        })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId)
          )
        )
        .limit(1);

      if (!membership || membership.state !== 'active') {
        res.status(403).json({ error: 'You are not a member of this workspace.' });
        return;
      }

      if (!allowedRoles.includes(membership.role as any)) {
        res.status(403).json({ error: 'Forbidden. You do not have the required workspace privileges.' });
        return;
      }

      // Attach workspace role to request context
      req.workspaceRole = membership.role;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Error validating workspace membership role.' });
    }
  };
};

/**
 * Middleware to restrict access based on Project-level roles.
 * Requires requireAuth to run first to populate req.user.
 */
export const requireProjectRole = (allowedRoles: ('project_admin' | 'developer' | 'viewer')[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized. Auth context missing.' });
        return;
      }

      if (!projectId || typeof projectId !== 'string') {
        res.status(400).json({ error: 'projectId is required for this action.' });
        return;
      }

      // Check project membership and role
      const [membership] = await db
        .select({
          role: projectMembers.role,
        })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, userId)
          )
        )
        .limit(1);

      if (!membership) {
        res.status(403).json({ error: 'You are not a member of this project.' });
        return;
      }

      if (!allowedRoles.includes(membership.role as any)) {
        res.status(403).json({ error: 'Forbidden. You do not have the required project privileges.' });
        return;
      }

      // Attach project role to request context
      req.projectRole = membership.role;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Error validating project membership role.' });
    }
  };
};
