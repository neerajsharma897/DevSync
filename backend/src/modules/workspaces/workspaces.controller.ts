import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { workspaces, workspaceMembers } from '../../db/schema/workspaces.js';
import { users } from '../../db/schema/auth.js';
import { eq, and, isNull } from 'drizzle-orm';

// ─── Helper: generate a URL-safe slug from a workspace name ──────────────────
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
};

// ─── CREATE WORKSPACE ────────────────────────────────────────────────────────
// POST /api/workspaces
export const createWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, iconUrl } = req.body;
    const userId = req.user!.userId;

    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Workspace name is required (min 2 characters).' });
      return;
    }

    // Generate a unique slug (append random suffix to avoid collisions)
    const baseSlug = generateSlug(name);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const result = await db.transaction(async (tx) => {
      // 1. Create the workspace
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: name.trim(),
          slug,
          description: description || null,
          iconUrl: iconUrl || null,
          ownerId: userId,
        })
        .returning();

      // 2. Add creator as owner in workspace_members
      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.workspaceId,
        userId,
        role: 'owner',
        state: 'active',
      });

      return workspace;
    });

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace: result,
    });
  } catch (err) {
    console.error('Create workspace error:', err);
    res.status(500).json({ error: 'Server error creating workspace.' });
  }
};

// ─── LIST MY WORKSPACES ──────────────────────────────────────────────────────
// GET /api/workspaces
export const listWorkspaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Get all workspaces where this user is an active member
    const results = await db
      .select({
        workspaceId: workspaces.workspaceId,
        name: workspaces.name,
        slug: workspaces.slug,
        iconUrl: workspaces.iconUrl,
        description: workspaces.description,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.state, 'active'),
          isNull(workspaces.deletedAt)
        )
      );

    res.json({ workspaces: results });
  } catch (err) {
    console.error('List workspaces error:', err);
    res.status(500).json({ error: 'Server error listing workspaces.' });
  }
};

// ─── GET SINGLE WORKSPACE ───────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId
export const getWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), isNull(workspaces.deletedAt)))
      .limit(1);

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found.' });
      return;
    }

    // Get member count
    const members = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        state: workspaceMembers.state,
        joinedAt: workspaceMembers.joinedAt,
        fullName: users.fullName,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        presence: users.presence,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.userId))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    res.json({ workspace, members });
  } catch (err) {
    console.error('Get workspace error:', err);
    res.status(500).json({ error: 'Server error fetching workspace.' });
  }
};

// ─── UPDATE WORKSPACE ────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId
export const updateWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;
    const { name, description, iconUrl } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;

    const [updated] = await db
      .update(workspaces)
      .set(updateData)
      .where(and(eq(workspaces.workspaceId, workspaceId), isNull(workspaces.deletedAt)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Workspace not found.' });
      return;
    }

    res.json({ message: 'Workspace updated', workspace: updated });
  } catch (err) {
    console.error('Update workspace error:', err);
    res.status(500).json({ error: 'Server error updating workspace.' });
  }
};

// ─── SOFT DELETE WORKSPACE ───────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId
export const deleteWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;

    const [deleted] = await db
      .update(workspaces)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(workspaces.workspaceId, workspaceId), isNull(workspaces.deletedAt)))
      .returning({ workspaceId: workspaces.workspaceId });

    if (!deleted) {
      res.status(404).json({ error: 'Workspace not found.' });
      return;
    }

    res.json({ message: 'Workspace deleted successfully' });
  } catch (err) {
    console.error('Delete workspace error:', err);
    res.status(500).json({ error: 'Server error deleting workspace.' });
  }
};

// ─── INVITE MEMBER ───────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/invite
export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params as Record<string, string>;
    const { email, role } = req.body;
    const inviterId = req.user!.userId;

    if (!email) {
      res.status(400).json({ error: 'Email is required to invite a member.' });
      return;
    }

    const memberRole = role || 'member';
    if (!['admin', 'member'].includes(memberRole)) {
      res.status(400).json({ error: 'Role must be "admin" or "member".' });
      return;
    }

    // Find the user by email
    const [targetUser] = await db
      .select({ userId: users.userId, fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!targetUser) {
      res.status(404).json({ error: 'No user found with that email. They must register first.' });
      return;
    }

    // Check if already a member
    const [existing] = await db
      .select({ id: workspaceMembers.id, state: workspaceMembers.state })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUser.userId)
        )
      )
      .limit(1);

    if (existing) {
      if (existing.state === 'active') {
        res.status(409).json({ error: 'User is already an active member of this workspace.' });
        return;
      }
      // Re-activate a previously deactivated member
      await db
        .update(workspaceMembers)
        .set({ state: 'active', role: memberRole, joinedAt: new Date() })
        .where(eq(workspaceMembers.id, existing.id));

      res.json({ message: 'Member re-activated', user: targetUser });
      return;
    }

    // Create membership
    await db.insert(workspaceMembers).values({
      workspaceId,
      userId: targetUser.userId,
      role: memberRole,
      invitedBy: inviterId,
      state: 'active',
    });

    res.status(201).json({ message: 'Member invited successfully', user: targetUser });
  } catch (err) {
    console.error('Invite member error:', err);
    res.status(500).json({ error: 'Server error inviting member.' });
  }
};

// ─── UPDATE MEMBER ROLE ──────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/members/:userId
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, userId } = req.params as Record<string, string>;
    const { role } = req.body;
    const currentUserId = req.user!.userId;

    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      res.status(400).json({ error: 'Role must be "owner", "admin", or "member".' });
      return;
    }

    // Prevent self-demotion
    if (userId === currentUserId) {
      res.status(400).json({ error: 'You cannot change your own role.' });
      return;
    }

    const [updated] = await db
      .update(workspaceMembers)
      .set({ role })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.state, 'active')
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Member not found in this workspace.' });
      return;
    }

    // If promoting to owner, transfer ownership
    if (role === 'owner') {
      await db
        .update(workspaces)
        .set({ ownerId: userId, updatedAt: new Date() })
        .where(eq(workspaces.workspaceId, workspaceId));

      // Demote current owner to admin
      await db
        .update(workspaceMembers)
        .set({ role: 'admin' })
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, currentUserId)
          )
        );
    }

    res.json({ message: 'Member role updated', member: updated });
  } catch (err) {
    console.error('Update member role error:', err);
    res.status(500).json({ error: 'Server error updating member role.' });
  }
};

// ─── REMOVE MEMBER ───────────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/members/:userId
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, userId } = req.params as Record<string, string>;
    const currentUserId = req.user!.userId;

    // Check if trying to remove the owner
    const [workspace] = await db
      .select({ ownerId: workspaces.ownerId })
      .from(workspaces)
      .where(eq(workspaces.workspaceId, workspaceId))
      .limit(1);

    if (workspace && workspace.ownerId === userId && userId !== currentUserId) {
      res.status(403).json({ error: 'Cannot remove the workspace owner.' });
      return;
    }

    // Allow self-leave (user removing themselves)
    // For others, the role middleware already ensures admin/owner access

    const [removed] = await db
      .update(workspaceMembers)
      .set({ state: 'deactivated' })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.state, 'active')
        )
      )
      .returning({ id: workspaceMembers.id });

    if (!removed) {
      res.status(404).json({ error: 'Member not found in this workspace.' });
      return;
    }

    res.json({ message: userId === currentUserId ? 'You have left the workspace' : 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Server error removing member.' });
  }
};
