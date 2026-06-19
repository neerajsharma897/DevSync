import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import { workspaces, workspaceMembers } from '../db/schema/workspaces.js';
import { projects, projectMembers } from '../db/schema/projects.js';
import { and, eq } from 'drizzle-orm';

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
      let workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;
      const slug = req.params.slug || req.body.slug || req.query.slug;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized. Auth context missing.' });
        return;
      }

      if (!workspaceId && slug) {
        const [ws] = await db
          .select({ workspaceId: workspaces.workspaceId })
          .from(workspaces)
          .where(eq(workspaces.slug, slug as string))
          .limit(1);
        
        if (ws) {
          workspaceId = ws.workspaceId;
          req.params.workspaceId = workspaceId; // inject for later controllers
        }
      }

      if (!workspaceId || typeof workspaceId !== 'string') {
        res.status(400).json({ error: 'workspaceId or slug is required for this action.' });
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
    } catch (err) {
      console.error('requireWorkspaceRole error:', err);
      res.status(500).json({ error: 'Error validating workspace membership role.' });
      return;
    }
    next();
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
      let projectId = req.params.projectId || req.body.projectId || req.query.projectId;
      const key = req.params.key || req.body.key || req.query.key;
      const slug = req.params.slug || req.body.slug || req.query.slug;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized. Auth context missing.' });
        return;
      }

      if (!projectId && key && slug) {
        // Resolve slug to workspaceId, then resolve key to projectId
        const [ws] = await db
          .select({ workspaceId: workspaces.workspaceId })
          .from(workspaces)
          .where(eq(workspaces.slug, slug as string))
          .limit(1);

        if (ws) {
          req.params.workspaceId = ws.workspaceId;
          const [proj] = await db
            .select({ projectId: projects.projectId })
            .from(projects)
            .where(
              and(
                eq(projects.workspaceId, ws.workspaceId),
                eq(projects.key, key as string)
              )
            )
            .limit(1);
          
          if (proj) {
            projectId = proj.projectId;
            req.params.projectId = projectId; // inject for later controllers
          }
        }
      }

      if (!projectId || typeof projectId !== 'string') {
        res.status(400).json({ error: 'projectId or (slug+key) is required for this action.' });
        return;
      }

      // If user is workspace owner/admin, implicitly grant project_admin access
      if (req.workspaceRole === 'owner' || req.workspaceRole === 'admin') {
        req.projectRole = 'project_admin';
        return next();
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
    } catch (err) {
      console.error('requireProjectRole error:', err);
      res.status(500).json({ error: 'Error validating project membership role.' });
      return;
    }
    next();
  };
};
