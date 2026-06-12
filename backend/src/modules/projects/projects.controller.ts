import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { projects, projectMembers } from '../../db/schema/projects.js';
import { workspaceMembers } from '../../db/schema/workspaces.js';
import { users } from '../../db/schema/auth.js';
import { eq, and, sql } from 'drizzle-orm';

// ─── CREATE PROJECT ──────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/projects
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;
    const { name, key, description, iconUrl } = req.body;
    const userId = req.user!.userId;

    if (!name || !key) {
      res.status(400).json({ error: 'Project name and key are required.' });
      return;
    }

    const projectKey = key.toUpperCase().trim().slice(0, 10);
    if (!/^[A-Z][A-Z0-9]{1,9}$/.test(projectKey)) {
      res.status(400).json({ error: 'Key must start with a letter, contain only A-Z and 0-9, and be 2-10 characters.' });
      return;
    }

    // Check for duplicate key in this workspace
    const [existing] = await db
      .select({ projectId: projects.projectId })
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.key, projectKey)))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: `Project key "${projectKey}" already exists in this workspace.` });
      return;
    }

    const result = await db.transaction(async (tx) => {
      // 1. Create project
      const [project] = await tx
        .insert(projects)
        .values({
          workspaceId,
          name: name.trim(),
          key: projectKey,
          description: description || null,
          iconUrl: iconUrl || null,
          leadUserId: userId,
        })
        .returning();

      // 2. Add creator as project_admin
      await tx.insert(projectMembers).values({
        projectId: project.projectId,
        userId,
        role: 'project_admin',
        addedBy: userId,
      });

      return project;
    });

    res.status(201).json({ message: 'Project created', project: result });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error creating project.' });
  }
};

// ─── LIST PROJECTS IN WORKSPACE ──────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/projects
export const listProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;

    const results = await db
      .select({
        projectId: projects.projectId,
        name: projects.name,
        key: projects.key,
        description: projects.description,
        iconUrl: projects.iconUrl,
        status: projects.status,
        issueCounter: projects.issueCounter,
        createdAt: projects.createdAt,
        leadName: users.fullName,
        leadAvatar: users.avatarUrl,
      })
      .from(projects)
      .leftJoin(users, eq(projects.leadUserId, users.userId))
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.status, 'active')));

    res.json({ projects: results });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Server error listing projects.' });
  }
};

// ─── GET SINGLE PROJECT ──────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/projects/:projectId
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.projectId, projectId))
      .limit(1);

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    // Get members
    const members = await db
      .select({
        id: projectMembers.id,
        userId: projectMembers.userId,
        role: projectMembers.role,
        addedAt: projectMembers.addedAt,
        fullName: users.fullName,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.userId))
      .where(eq(projectMembers.projectId, projectId));

    res.json({ project, members });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error fetching project.' });
  }
};

// ─── UPDATE PROJECT ──────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/projects/:projectId
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const { name, description, iconUrl, status } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (status !== undefined) {
      if (!['active', 'archived'].includes(status)) {
        res.status(400).json({ error: 'Status must be "active" or "archived".' });
        return;
      }
      updateData.status = status;
    }

    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.projectId, projectId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    res.json({ message: 'Project updated', project: updated });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Server error updating project.' });
  }
};

// ─── ADD PROJECT MEMBER ──────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/projects/:projectId/members
export const addProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, projectId } = req.params as Record<string, string>;
    const { userId: targetUserId, role } = req.body;
    const addedBy = req.user!.userId;

    if (!targetUserId) {
      res.status(400).json({ error: 'userId is required.' });
      return;
    }

    const memberRole = role || 'developer';
    if (!['project_admin', 'developer', 'viewer'].includes(memberRole)) {
      res.status(400).json({ error: 'Role must be "project_admin", "developer", or "viewer".' });
      return;
    }

    // Verify the target user is a member of the workspace
    const [wsMember] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId),
          eq(workspaceMembers.state, 'active')
        )
      )
      .limit(1);

    if (!wsMember) {
      res.status(400).json({ error: 'User must be a workspace member before being added to a project.' });
      return;
    }

    // Check if already a project member
    const [existing] = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId)))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: 'User is already a member of this project.' });
      return;
    }

    const [member] = await db
      .insert(projectMembers)
      .values({
        projectId,
        userId: targetUserId,
        role: memberRole,
        addedBy,
      })
      .returning();

    res.status(201).json({ message: 'Member added to project', member });
  } catch (err) {
    console.error('Add project member error:', err);
    res.status(500).json({ error: 'Server error adding project member.' });
  }
};

// ─── REMOVE PROJECT MEMBER ──────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/projects/:projectId/members/:userId
export const removeProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, userId } = req.params as Record<string, string>;

    const [removed] = await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .returning({ id: projectMembers.id });

    if (!removed) {
      res.status(404).json({ error: 'Member not found in this project.' });
      return;
    }

    res.json({ message: 'Member removed from project' });
  } catch (err) {
    console.error('Remove project member error:', err);
    res.status(500).json({ error: 'Server error removing project member.' });
  }
};
