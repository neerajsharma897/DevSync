import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { githubConnections, githubCommits, githubCiStatus } from '../../db/schema/github.js';
import { tasks } from '../../db/schema/tasks.js';
import { projects, projectMembers } from '../../db/schema/projects.js';
import { users } from '../../db/schema/auth.js';
import { eq, and, sql, inArray, or, desc, isNull, isNotNull, count } from 'drizzle-orm';
import { logAuditAction } from '../audit/audit.controller.js';
import { createNotification } from '../notifications/notifications.controller.js';
import { encrypt, decrypt } from '../../lib/encryption.js';

// ─── HELPER: Verify GitHub Webhook Signature ─────────────────────────────────
function verifyGitHubSignature(rawBody: Buffer, signatureHeader: string | undefined, webhookSecret: string): boolean {
  if (!signatureHeader) return false;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// ─── HELPER: GitHub API fetch ────────────────────────────────────────────────
async function githubApiFetch(url: string, token: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  }) as unknown as Response;
}

// ─── CONNECT PROJECT TO GITHUB ───────────────────────────────────────────────
// POST /api/workspaces/:slug/projects/:key/github/connect
export const connectGithubRepo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const userId = req.user!.userId;
    const { repo_owner, repo_name, access_token } = req.body;

    if (!repo_owner || !repo_name || !access_token) {
      res.status(400).json({ error: 'repo_owner, repo_name, and access_token are required.' });
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

    // Step 1: Verify the repo exists via GitHub API
    const repoResponse = await fetch(`https://api.github.com/repos/${repo_owner}/${repo_name}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (repoResponse.status === 404) {
      res.status(404).json({ error: 'Repository not found or token has no access.' });
      return;
    }
    if (repoResponse.status === 401) {
      res.status(401).json({ error: 'Invalid GitHub token.' });
      return;
    }
    if (!repoResponse.ok) {
      const errBody = await repoResponse.text();
      console.error('GitHub API error verifying repo:', repoResponse.status, errBody);
      res.status(502).json({ error: 'Failed to verify repository on GitHub.' });
      return;
    }

    const repoData = await repoResponse.json() as Record<string, any>;
    const repoFullName = repoData.full_name as string;    // "octocat/my-repo"
    const repoId = repoData.id as number;
    const defaultBranch = (repoData.default_branch as string) || 'main';

    // Step 2: Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Step 3: Create webhook on GitHub
    const webhookUrl = `${env.BACKEND_URL}/api/webhooks/github/${projectId}`;

    const hookResponse = await fetch(`https://api.github.com/repos/${repo_owner}/${repo_name}/hooks`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push', 'workflow_run'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret,
        },
      }),
    });

    if (!hookResponse.ok) {
      const hookErr = await hookResponse.text();
      console.error('GitHub API error creating webhook:', hookResponse.status, hookErr);
      res.status(502).json({ error: 'Failed to create webhook on GitHub. Ensure the token has admin:repo_hook scope.' });
      return;
    }

    const hookData = await hookResponse.json() as Record<string, any>;
    const webhookId = hookData.id as number;

    // Step 4: Save connection with encrypted secrets
    const result = await db.transaction(async (tx) => {
      const [connection] = await tx
        .insert(githubConnections)
        .values({
          projectId,
          connectedBy: userId,
          githubRepoFullName: repoFullName,
          githubRepoId: repoId,
          defaultBranch,
          githubAccessToken: encrypt(access_token),
          webhookId,
          webhookSecret: encrypt(webhookSecret),
        })
        .returning();

      const [project] = await tx
        .select({ workspaceId: projects.workspaceId })
        .from(projects)
        .where(eq(projects.projectId, projectId))
        .limit(1);

      await logAuditAction({
        actorId: userId,
        action: 'github.repo_linked',
        entityType: 'project',
        entityId: projectId,
        workspaceId: project?.workspaceId ?? undefined,
        newValues: { repo_full_name: repoFullName, webhook_url: webhookUrl },
        tx,
      });

      return connection;
    });

    res.status(201).json({
      message: 'GitHub repository connected successfully.',
      connection: {
        connectionId: result.connectionId,
        githubRepoFullName: result.githubRepoFullName,
        defaultBranch: result.defaultBranch,
        webhookStatus: 'active',
      },
    });
  } catch (err) {
    console.error('Connect GitHub error:', err);
    res.status(500).json({ error: 'Server error connecting GitHub repo.' });
  }
};

// ─── DISCONNECT GITHUB REPO ─────────────────────────────────────────────────
// DELETE /api/workspaces/:slug/projects/:key/github/disconnect
export const disconnectGithubRepo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;

    // Fetch the connection
    const [connection] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId))
      .limit(1);

    if (!connection) {
      res.status(404).json({ error: 'No GitHub connection found for this project.' });
      return;
    }

    // Step 1: Delete webhook from GitHub
    if (connection.githubAccessToken && connection.webhookId && connection.githubRepoFullName) {
      try {
        const token = decrypt(connection.githubAccessToken);
        const deleteRes = await fetch(
          `https://api.github.com/repos/${connection.githubRepoFullName}/hooks/${connection.webhookId}`,
          {
            method: 'DELETE',
            headers: {
              'Accept': 'application/vnd.github+json',
              'Authorization': `Bearer ${token}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );
        if (!deleteRes.ok && deleteRes.status !== 404) {
          console.warn('Failed to delete webhook from GitHub:', deleteRes.status, await deleteRes.text());
        }
      } catch (webhookErr) {
        // Token may be revoked or repo deleted — log but continue
        console.warn('Could not delete webhook from GitHub (token may be revoked):', webhookErr);
      }
    }

    // Step 2: Delete the connection row (preserve commits and CI data)
    await db.transaction(async (tx) => {
      await tx
        .delete(githubConnections)
        .where(eq(githubConnections.projectId, projectId));

      const [project] = await tx
        .select({ workspaceId: projects.workspaceId })
        .from(projects)
        .where(eq(projects.projectId, projectId))
        .limit(1);

      await logAuditAction({
        actorId: req.user!.userId,
        action: 'github.repo_unlinked',
        entityType: 'project',
        entityId: projectId,
        workspaceId: project?.workspaceId ?? undefined,
        oldValues: { repo_full_name: connection.githubRepoFullName },
        newValues: null,
        tx,
      });
    });

    res.json({ message: 'GitHub repository disconnected. Existing commit and CI data has been preserved.' });
  } catch (err) {
    console.error('Disconnect GitHub error:', err);
    res.status(500).json({ error: 'Server error disconnecting GitHub repo.' });
  }
};

// ─── GET CONNECTION STATUS ──────────────────────────────────────────────────
// GET /api/workspaces/:slug/projects/:key/github/connection
export const getGithubConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;

    const [connection] = await db
      .select({
        connectionId: githubConnections.connectionId,
        githubRepoFullName: githubConnections.githubRepoFullName,
        defaultBranch: githubConnections.defaultBranch,
        webhookId: githubConnections.webhookId,
        createdAt: githubConnections.createdAt,
        connectedByName: users.fullName,
        connectedByAvatar: users.avatarUrl,
      })
      .from(githubConnections)
      .leftJoin(users, eq(githubConnections.connectedBy, users.userId))
      .where(eq(githubConnections.projectId, projectId))
      .limit(1);

    if (!connection) {
      res.json({ connection: null });
      return;
    }

    res.json({
      connection: {
        ...connection,
        webhookStatus: connection.webhookId ? 'active' : 'inactive',
      },
    });
  } catch (err) {
    console.error('Get GitHub connection error:', err);
    res.status(500).json({ error: 'Server error fetching GitHub connection.' });
  }
};

// ─── GITHUB WEBHOOK HANDLER ──────────────────────────────────────────────────
// POST /api/webhooks/github/:projectId
export const handleGithubWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const event = req.headers['x-github-event'] as string;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    // Handle ping event first — no signature verification needed for sanity
    if (event === 'ping') {
      res.status(200).send('pong');
      return;
    }

    // Fetch the connection for this project
    const [connection] = await db
      .select({
        projectId: githubConnections.projectId,
        webhookSecret: githubConnections.webhookSecret,
      })
      .from(githubConnections)
      .where(eq(githubConnections.projectId, projectId))
      .limit(1);

    if (!connection || !connection.webhookSecret) {
      res.status(404).send('Project not found or no webhook configured.');
      return;
    }

    // Verify HMAC signature using the raw body buffer
    const rawBody = req.body as Buffer;
    const decryptedSecret = decrypt(connection.webhookSecret);

    if (!verifyGitHubSignature(rawBody, signature, decryptedSecret)) {
      res.status(401).send('Invalid signature.');
      return;
    }

    // Parse the payload from raw body
    const payload = JSON.parse(rawBody.toString());

    if (!connection.projectId) {
      res.status(400).send('Connection has no project.');
      return;
    }

    // Route to correct handler
    if (event === 'push') {
      await handlePushEvent(connection.projectId, payload);
    } else if (event === 'workflow_run') {
      await handleWorkflowRunEvent(connection.projectId, payload);
    }

    // Always return 200 quickly — GitHub retries on non-2xx
    res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Server error processing webhook.');
  }
};

// ─── PUSH EVENT HANDLER ──────────────────────────────────────────────────────
const handlePushEvent = async (projectId: string, payload: any) => {
  const commits = payload.commits || [];
  const branchName = payload.ref ? payload.ref.replace('refs/heads/', '') : null;
  const repoFullName = payload.repository?.full_name || '';

  for (const commit of commits) {
    // Check if we already processed this commit (duplicate delivery)
    const [existingCommit] = await db
      .select({ id: githubCommits.id })
      .from(githubCommits)
      .where(
        and(
          eq(githubCommits.repoFullName, repoFullName),
          eq(githubCommits.commitSha, commit.id)
        )
      )
      .limit(1);

    if (existingCommit) continue;

    const message = commit.message || '';
    const headline = message.split('\n')[0].substring(0, 200);
    const authorName = commit.author?.name || null;
    const authorUsername = commit.author?.username || null;
    const committedAt = new Date(commit.timestamp);
    const url = commit.url || null;

    // Attempt to match author by GitHub login or email
    let authorUserId: string | null = null;
    const authorEmail = commit.author?.email;

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

    // Parse ALL task keys from commit message using the universal regex
    const upperMessage = message.toUpperCase();
    const taskKeyRegex = /\b([A-Z]{1,10}-\d+)\b/g;
    const matches = [...upperMessage.matchAll(taskKeyRegex)];
    const taskKeys = [...new Set(matches.map(m => m[1]))]; // deduplicate

    if (taskKeys.length > 0) {
      // Link commit to ALL matched tasks
      for (const taskKey of taskKeys) {
        const [task] = await db
          .select({ taskId: tasks.taskId, taskKey: tasks.taskKey, assigneeId: tasks.assigneeId, reporterId: tasks.reporterId })
          .from(tasks)
          .where(
            and(
              eq(tasks.projectId, projectId),
              eq(tasks.taskKey, taskKey),
              isNull(tasks.deletedAt)
            )
          )
          .limit(1);

        if (!task) continue;

        // Insert commit row linked to this task
        await db.insert(githubCommits).values({
          projectId,
          taskId: task.taskId,
          commitSha: commit.id,
          repoFullName,
          message,
          messageHeadline: headline,
          authorName,
          authorGithubLogin: authorUsername,
          authorUserId,
          committedAt,
          branchName,
          url,
        }).onConflictDoNothing(); // safety: unique constraint on (repo_full_name, commit_sha) per schema

        // Increment linked_commits_count on the task
        await db
          .update(tasks)
          .set({ linkedCommitsCount: sql`linked_commits_count + 1` })
          .where(eq(tasks.taskId, task.taskId));

        // Notifications for task assignee and reporter
        const notifyUser = async (recipientId: string | null) => {
          if (recipientId && recipientId !== authorUserId) {
            await createNotification({
              recipientId,
              actorId: authorUserId || undefined,
              type: 'commit_linked',
              entityType: 'task',
              entityId: task.taskId,
              title: `New commit linked to ${task.taskKey}`,
              body: `${authorName || 'Someone'} pushed "${headline}" on ${branchName || 'a branch'}`,
            });
          }
        };

        await notifyUser(task.assigneeId);
        if (task.reporterId !== task.assigneeId) {
          await notifyUser(task.reporterId);
        }

        // Audit log
        await logAuditAction({
          actorId: authorUserId,
          action: 'github.commit_received',
          entityType: 'task',
          entityId: task.taskId,
          newValues: { commit_sha: commit.id.substring(0, 7), task_key: task.taskKey, branch: branchName },
        });
      }
    } else {
      // No task key found — store commit unlinked
      const insertResult = await db.insert(githubCommits).values({
        projectId,
        taskId: null,
        commitSha: commit.id,
        repoFullName,
        message,
        messageHeadline: headline,
        authorName,
        authorGithubLogin: authorUsername,
        authorUserId,
        committedAt,
        branchName,
        url,
      }).onConflictDoNothing().returning({ id: githubCommits.id });

      if (insertResult.length > 0) {
        // Find project members to notify
        const members = await db
          .select({ userId: projectMembers.userId })
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, projectId),
              inArray(projectMembers.role, ['project_admin', 'developer'])
            )
          );

        const [project] = await db.select({ name: projects.name }).from(projects).where(eq(projects.projectId, projectId));

        for (const member of members) {
          if (member.userId !== authorUserId) {
            await createNotification({
              recipientId: member.userId as string,
              actorId: authorUserId || undefined,
              type: 'commit_unlinked',
              entityType: 'project',
              entityId: projectId,
              title: `New commit in ${project?.name || 'Project'}`,
              body: `${authorName || 'Someone'} pushed "${headline}" on ${branchName || 'a branch'}`,
            });
          }
        }
      }
    }
  }
};

// ─── WORKFLOW RUN EVENT HANDLER ──────────────────────────────────────────────
const handleWorkflowRunEvent = async (projectId: string, payload: any) => {
  const workflowRun = payload.workflow_run;
  if (!workflowRun) return;

  const runId = workflowRun.id;

  const [existing] = await db
    .select({ id: githubCiStatus.id, status: githubCiStatus.status, conclusion: githubCiStatus.conclusion })
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
      triggeredAt: new Date(workflowRun.created_at || workflowRun.run_started_at),
      completedAt: workflowRun.updated_at ? new Date(workflowRun.updated_at) : null,
    });
  }

  // Fire CI status notification
  if (workflowRun.status === 'completed' && (workflowRun.conclusion === 'failure' || workflowRun.conclusion === 'success')) {
    let shouldNotify = false;
    if (!existing) {
      shouldNotify = true;
    } else if (existing.status !== 'completed' || existing.conclusion !== workflowRun.conclusion) {
      shouldNotify = true;
    }

    if (shouldNotify) {
      const [project] = await db.select({ name: projects.name }).from(projects).where(eq(projects.projectId, projectId));
      const members = await db
        .select({ userId: projectMembers.userId })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            inArray(projectMembers.role, ['project_admin', 'developer'])
          )
        );

      const type = workflowRun.conclusion === 'success' ? 'ci_passed' : 'ci_failed';
      const title = workflowRun.conclusion === 'success' 
        ? `CI passed in ${project?.name || 'Project'}` 
        : `CI failed in ${project?.name || 'Project'}`;

      for (const member of members) {
        await createNotification({
          recipientId: member.userId as string,
          type,
          entityType: 'project',
          entityId: projectId,
          title,
          body: `Workflow '${workflowRun.name}' ${workflowRun.conclusion} on ${workflowRun.head_branch} (commit ${workflowRun.head_sha?.substring(0, 7)})`,
        });
      }

      await logAuditAction({
        actorId: null,
        action: 'github.ci_status_received',
        entityType: 'project',
        entityId: projectId,
        newValues: {
          workflow_name: workflowRun.name,
          conclusion: workflowRun.conclusion,
          head_branch: workflowRun.head_branch,
          run_id: workflowRun.id,
        },
      });
    }
  }
};

// ─── GET COMMITS FOR PROJECT ─────────────────────────────────────────────────
// GET /api/workspaces/:slug/projects/:key/github/commits
export const getGithubCommits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 25), 100);
    const offset = (page - 1) * limit;
    const branch = req.query.branch as string | undefined;
    const linked = req.query.linked as string | undefined; // 'true' | 'false' | 'all'

    // Build conditions
    const conditions = [eq(githubCommits.projectId, projectId)];
    if (branch && branch !== 'all') {
      conditions.push(eq(githubCommits.branchName, branch));
    }
    if (linked === 'true') {
      conditions.push(isNotNull(githubCommits.taskId));
    } else if (linked === 'false') {
      conditions.push(isNull(githubCommits.taskId));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(githubCommits)
      .where(whereClause);

    // Get paginated commits with joins
    const commitRows = await db
      .select({
        id: githubCommits.id,
        commitSha: githubCommits.commitSha,
        messageHeadline: githubCommits.messageHeadline,
        authorName: githubCommits.authorName,
        authorGithubLogin: githubCommits.authorGithubLogin,
        authorUserId: githubCommits.authorUserId,
        authorAvatar: users.avatarUrl,
        committedAt: githubCommits.committedAt,
        branchName: githubCommits.branchName,
        url: githubCommits.url,
        taskId: githubCommits.taskId,
        taskKey: tasks.taskKey,
      })
      .from(githubCommits)
      .leftJoin(tasks, eq(githubCommits.taskId, tasks.taskId))
      .leftJoin(users, eq(githubCommits.authorUserId, users.userId))
      .where(whereClause)
      .orderBy(desc(githubCommits.committedAt))
      .limit(limit)
      .offset(offset);

    // Get distinct branches for filter dropdown
    const branchRows = await db
      .selectDistinct({ branchName: githubCommits.branchName })
      .from(githubCommits)
      .where(and(eq(githubCommits.projectId, projectId), isNotNull(githubCommits.branchName)));

    const branches = branchRows.map(r => r.branchName).filter(Boolean) as string[];

    res.json({
      commits: commitRows,
      totalCount: Number(totalCount),
      page,
      totalPages: Math.ceil(Number(totalCount) / limit),
      branches,
    });
  } catch (err) {
    console.error('Get GitHub commits error:', err);
    res.status(500).json({ error: 'Server error fetching commits.' });
  }
};

// ─── GET CI RUNS FOR PROJECT ─────────────────────────────────────────────────
// GET /api/workspaces/:slug/projects/:key/github/ci
export const getGithubCiRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as Record<string, string>;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 25), 100);
    const offset = (page - 1) * limit;
    const branch = req.query.branch as string | undefined;
    const conclusion = req.query.conclusion as string | undefined;

    // Build conditions
    const conditions = [eq(githubCiStatus.projectId, projectId)];
    if (branch && branch !== 'all') {
      conditions.push(eq(githubCiStatus.headBranch, branch));
    }
    if (conclusion && conclusion !== 'all') {
      conditions.push(eq(githubCiStatus.conclusion, conclusion));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(githubCiStatus)
      .where(whereClause);

    // Get paginated runs
    const runRows = await db
      .select()
      .from(githubCiStatus)
      .where(whereClause)
      .orderBy(desc(githubCiStatus.triggeredAt))
      .limit(limit)
      .offset(offset);

    // Get distinct branches for filter dropdown
    const branchRows = await db
      .selectDistinct({ headBranch: githubCiStatus.headBranch })
      .from(githubCiStatus)
      .where(and(eq(githubCiStatus.projectId, projectId), isNotNull(githubCiStatus.headBranch)));

    const branches = branchRows.map(r => r.headBranch).filter(Boolean) as string[];

    res.json({
      runs: runRows,
      totalCount: Number(totalCount),
      page,
      totalPages: Math.ceil(Number(totalCount) / limit),
      branches,
    });
  } catch (err) {
    console.error('Get GitHub CI runs error:', err);
    res.status(500).json({ error: 'Server error fetching CI runs.' });
  }
};

// ─── GET COMMITS FOR A SPECIFIC TASK ─────────────────────────────────────────
// GET /api/workspaces/:slug/projects/:key/tasks/:taskKey/commits
export const getTaskCommits = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = (req.params.taskId || res.locals.taskId) as string;

    if (!taskId) {
      res.status(400).json({ error: 'Task ID is required.' });
      return;
    }

    const commitRows = await db
      .select({
        id: githubCommits.id,
        commitSha: githubCommits.commitSha,
        messageHeadline: githubCommits.messageHeadline,
        authorName: githubCommits.authorName,
        authorGithubLogin: githubCommits.authorGithubLogin,
        committedAt: githubCommits.committedAt,
        branchName: githubCommits.branchName,
        url: githubCommits.url,
      })
      .from(githubCommits)
      .where(eq(githubCommits.taskId, taskId))
      .orderBy(desc(githubCommits.committedAt));

    res.json({ commits: commitRows });
  } catch (err) {
    console.error('Get task commits error:', err);
    res.status(500).json({ error: 'Server error fetching task commits.' });
  }
};
