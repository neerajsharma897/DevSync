export type UserRole = 'owner' | 'admin' | 'member';
export type UserStatus = 'online' | 'away' | 'offline';

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  role: UserRole;
  githubUsername?: string;
  googleConnected: boolean;
  status: UserStatus;
  title: string;
  bio?: string;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl: string | null;
  plan: string;
  storageUsed: number;
  storageLimit: number;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export type ProjectStatus = 'active' | 'archived';
export type CICDStatus = 'success' | 'failure' | 'running' | 'none';

export interface SonarMetrics {
  bugs: number;
  vulnerabilities: number;
  codeSmells: number;
  coverage: number;
  duplications: number;
  rating: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  githubRepoUrl: string | null;
  githubWebhookId: string | null;
  sonarcloudProjectKey: string | null;
  ciStatus: CICDStatus;
  status: ProjectStatus;
  createdBy: string;
  createdAt: string;
  taskCount: number;
  completedTaskCount: number;
  memberIds: string[];
  labels: string[];
  sonarMetrics: SonarMetrics | null;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Task {
  id: string;
  projectId: string;
  sprintId: string | null;
  parentTaskId: string | null;
  title: string;
  description: any; // TipTap content
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  activityLog: any[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'closed';
  summary: any | null;
  contributionReport: any | null;
  closedAt: string | null;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  body: string;
  type: 'text' | 'file';
  parentMessageId: string | null;
  metadata: any | null;
  isPinned: boolean;
  editedAt: string | null;
  createdAt: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  projectId: string | null;
  name: string;
  isPrivate: boolean;
  isDirectMessage: boolean;
  createdBy: string;
  createdAt: string;
}
