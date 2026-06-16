import { create } from 'zustand';
import { Task, TaskStatus } from '../types';
import { apiFetch } from '../lib/api';
import { useWorkspaceStore } from './workspaceStore';
import { useProjectStore } from './useProjectStore';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (title: string, description: string, status: TaskStatus) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTaskSprint: (taskId: string, sprintId: string | null) => Promise<void>;
  updateTaskAssignee: (taskId: string, assigneeId: string | null) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    const project = useProjectStore.getState().activeProject;
    
    if (!workspace || !project) return;

    set({ isLoading: true });
    try {
      const data = await apiFetch(`/workspaces/${workspace.slug}/projects/${project.id}/tasks`);
      
      const mappedTasks: Task[] = data.tasks.map((t: any) => ({
        id: t.taskId,
        taskKey: t.taskKey,
        title: t.title,
        description: t.description || '',
        status: t.status as TaskStatus,
        priority: t.priority || 'medium',
        type: t.type || 'task',
        assigneeId: t.assigneeId,
        reporterId: t.reporterId,
        sprintId: t.sprintId,
        createdAt: t.createdAt
      }));

      set({ tasks: mappedTasks, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      set({ isLoading: false });
    }
  },

  createTask: async (title, description, status) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    const project = useProjectStore.getState().activeProject;
    
    if (!workspace || !project) return;

    try {
      await apiFetch(`/workspaces/${workspace.slug}/projects/${project.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          status,
          type: 'task',
          priority: 'medium'
        })
      });
      get().fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  },

  updateTaskStatus: async (taskId, status) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    const project = useProjectStore.getState().activeProject;
    
    if (!workspace || !project) return;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
    }));

    try {
      await apiFetch(`/workspaces/${workspace.slug}/projects/${project.id}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert on failure by refetching
      get().fetchTasks();
    }
  },

  updateTaskSprint: async (taskId, sprintId) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    const project = useProjectStore.getState().activeProject;
    
    if (!workspace || !project) return;

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, sprintId } : t))
    }));

    try {
      await apiFetch(`/workspaces/${workspace.slug}/projects/${project.id}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sprintId })
      });
    } catch (err) {
      console.error('Failed to update task sprint:', err);
      get().fetchTasks();
    }
  },

  updateTaskAssignee: async (taskId, assigneeId) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    const project = useProjectStore.getState().activeProject;
    
    if (!workspace || !project) return;

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, assigneeId } : t))
    }));

    try {
      await apiFetch(`/workspaces/${workspace.slug}/projects/${project.id}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId })
      });
    } catch (err) {
      console.error('Failed to update task assignee:', err);
      get().fetchTasks();
    }
  },

  deleteTask: async (taskId) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    const project = useProjectStore.getState().activeProject;
    
    if (!workspace || !project) return;

    // Optimistic delete
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId)
    }));

    try {
      await apiFetch(`/workspaces/${workspace.slug}/projects/${project.id}/tasks/${taskId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
      get().fetchTasks();
    }
  }
}));
