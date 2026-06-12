import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../../config/db.js';
import { githubConnections, githubCommits, githubCiStatus } from '../../db/schema/github.js';
import { tasks } from '../../db/schema/tasks.js';
import { projects } from '../../db/schema/projects.js';
import { users } from '../../db/schema/auth.js';
import { eq, and, sql } from 'drizzle-orm';

// ─── HELPER: Verify GitHub Webhook Signature ─────────────────────────────────
const verifySignature = (req: Request, secret: string) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  // Ideally we use req.rawBody if configured, but express.json() might have parsed it.
  // Assuming a custom middleware sets req.rawBody or we handle stringified body.
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (err) {
    return false;
  }
};

// ─── CONNECT PROJECT TO GITHUB ───────────────────────────────────────────────
// POST /api/projects/:projectId/github/connect
export const connectGithubRepo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const { githubRepoFullName, defaultBranch } = req.body;

    if (!githubRepoFullName) {
      res.status(400).json({ error: 'GitHub repository full name is required (e.g. owner/repo).' });
      return;
    }

    // Check if already connected
    const [existing] = await db
      .select({ connectionId: githubConnections.connectionId })
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: 'Project is already connected to a GitHub repository.' });
      return;
    }

    // Generate a webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    const [connection] = await db
      .insert(githubConnections)
      .values({
        projectId,
        connectedBy: userId,
        githubRepoFullName,
        defaultBranch: defaultBranch || 'main',
        webhookSecret, // In production, this should be encrypted at rest
      })
      .returning();

    res.status(201).json({
      message: 'GitHub connected. Please configure the webhook on GitHub using the provided secret.',
      connection,
      webhookUrl: `${process.env.FRONTEND_URL?.replace('5173', '3001')}/api/webhooks/github`, // Example URL
    });
  } catch (err) {
    console.error('Connect GitHub error:', err);
    res.status(500).json({ error: 'Server error connecting GitHub repo.' });
  }
};

// ─── GITHUB WEBHOOK HANDLER ──────────────────────────────────────────────────
// POST /api/webhooks/github
export const handleGithubWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.headers['x-github-event'] as string;
    const payload = req.body;

    // 1. Find connection by repo full name
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) {
      res.status(400).send('No repository found in payload.');
      return;
    }

    const [connection] = await db
      .select({
        projectId: githubConnections.projectId,
        webhookSecret: githubConnections.webhookSecret,
      })
      .from(githubConnections)
      .where(eq(githubConnections.githubRepoFullName, repoFullName))
      .limit(1);

    if (!connection || !connection.webhookSecret) {
      res.status(404).send('Repository not linked to any project.');
      return;
    }

    // 2. Verify Signature
    if (!verifySignature(req, connection.webhookSecret)) {
      res.status(401).send('Invalid signature.');
      return;
    }

    // 3. Handle Events
    if (!connection.projectId) {
      res.status(400).send('Repository connected to a null project.');
      return;
    }

    if (event === 'push') {
      await handlePushEvent(connection.projectId, payload);
    } else if (event === 'workflow_run') {
      await handleWorkflowRunEvent(connection.projectId, payload);
    }

    res.status(200).send('Webhook received.');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Server error processing webhook.');
  }
};

// ─── PUSH EVENT HANDLER ──────────────────────────────────────────────────────
const handlePushEvent = async (projectId: string, payload: any) => {
  const commits = payload.commits || [];
  const branchName = payload.ref ? payload.ref.replace('refs/heads/', '') : null;

  for (const commit of commits) {
    // Check if we already processed this commit
    const [existingCommit] = await db
      .select({ id: githubCommits.id })
      .from(githubCommits)
      .where(
        and(
          eq(githubCommits.repoFullName, payload.repository.full_name),
          eq(githubCommits.commitSha, commit.id)
        )
      )
      .limit(1);

    if (existingCommit) continue;

    // Extract task key from commit message (e.g., PROJ-123)
    // First, get project key to build regex
    const [project] = await db
      .select({ key: projects.key })
      .from(projects)
      .where(eq(projects.projectId, projectId))
      .limit(1);

    let matchedTaskId = null;

    if (project) {
      const regex = new RegExp(`${project.key}-\\d+`, 'i');
      const match = commit.message.match(regex);

      if (match) {
        const taskKey = match[0].toUpperCase();
        const [task] = await db
          .select({ taskId: tasks.taskId })
          .from(tasks)
          .where(and(eq(tasks.projectId, projectId), eq(tasks.taskKey, taskKey)))
          .limit(1);

        if (task) {
          matchedTaskId = task.taskId;
        }
      }
    }

    // Attempt to match author by GitHub login or email
    let authorUserId = null;
    const authorEmail = commit.author?.email;
    const authorUsername = commit.author?.username;

    if (authorEmail || authorUsername) {
      const conditions = [];
      if (authorEmail) conditions.push(eq(users.email, authorEmail.toLowerCase()));
      if (authorUsername) conditions.push(eq(users.githubLogin, authorUsername));

      const [user] = await db
        .select({ userId: users.userId })
        .from(users)
        .where(or(...conditions))
        .limit(1);

      if (user) authorUserId = user.userId;
    }

    const [insertedCommit] = await db.insert(githubCommits).values({
      projectId,
      taskId: matchedTaskId,
      commitSha: commit.id,
      repoFullName: payload.repository.full_name,
      message: commit.message,
      messageHeadline: commit.message.split('\n')[0].slice(0, 200),
      authorName: commit.author?.name,
      authorGithubLogin: authorUsername,
      authorUserId,
      committedAt: new Date(commit.timestamp),
      branchName,
      url: commit.url,
    }).returning({ taskId: githubCommits.taskId });

    // Update task linked commits count
    if (insertedCommit && insertedCommit.taskId) {
      await db
        .update(tasks)
        .set({ linkedCommitsCount: sql`linked_commits_count + 1` })
        .where(eq(tasks.taskId, insertedCommit.taskId));
    }
  }
};

// ─── WORKFLOW RUN EVENT HANDLER ──────────────────────────────────────────────
const handleWorkflowRunEvent = async (projectId: string, payload: any) => {
  const workflowRun = payload.workflow_run;
  if (!workflowRun) return;

  const runId = workflowRun.id;

  const [existing] = await db
    .select({ id: githubCiStatus.id })
    .from(githubCiStatus)
    .where(and(eq(githubCiStatus.projectId, projectId), eq(githubCiStatus.runId, runId)))
    .limit(1);

  if (existing) {
    await db
      .update(githubCiStatus)
      .set({
        status: workflowRun.status,
        conclusion: workflowRun.conclusion,
        completedAt: workflowRun.updated_at ? new Date(workflowRun.updated_at) : null,
      })
      .where(eq(githubCiStatus.id, existing.id));
  } else {
    await db.insert(githubCiStatus).values({
      projectId,
      workflowName: workflowRun.name,
      runId,
      status: workflowRun.status,
      conclusion: workflowRun.conclusion,
      headBranch: workflowRun.head_branch,
      headSha: workflowRun.head_sha,
      htmlUrl: workflowRun.html_url,
      triggeredAt: new Date(workflowRun.created_at),
    });
  }
};

// Helper import for OR conditions
import { or } from 'drizzle-orm';
