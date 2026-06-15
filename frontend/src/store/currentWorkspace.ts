import { create } from 'zustand';
import { apiFetch } from '../lib/api.js';

interface Project {
  projectId: string;
  name: string;
  key: string;
}

interface Channel {
  channelId: string;
  name: string;
  isPrivate: boolean;
}

interface CurrentWorkspaceState {
  workspaceId: string;
  name: string;
  slug: string;
  projects: Project[];
  channels: Channel[];
  isLoading: boolean;
  error: string | null;
  fetchWorkspaceData: (slug: string) => Promise<void>;
  createChannel: (slug: string, name: string, isPrivate: boolean) => Promise<void>;
  createProject: (slug: string, name: string, key: string, description?: string) => Promise<void>;
}

export const useCurrentWorkspaceStore = create<CurrentWorkspaceState>((set, get) => ({
  workspaceId: '',
  name: '',
  slug: '',
  projects: [],
  channels: [],
  isLoading: true,
  error: null,

  fetchWorkspaceData: async (slug: string) => {
    set({ isLoading: true, error: null });
    try {
      // The backend /api/workspaces/:slug endpoint returns the workspace, members, channels, and projects
      const data = await apiFetch(`/workspaces/${slug}`);
      set({
        workspaceId: data.workspace.workspaceId,
        name: data.workspace.name,
        slug: data.workspace.slug,
        projects: data.projects || [],
        channels: data.channels || [],
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Failed to load workspace data:', err);
      set({ error: err.message || 'Failed to load workspace', isLoading: false });
    }
  },

  createChannel: async (slug, name, isPrivate) => {
    const data = await apiFetch(`/workspaces/${slug}/channels`, {
      method: 'POST',
      body: JSON.stringify({ name, isPrivate }),
    });
    set((state) => ({
      channels: [...state.channels, data.channel],
    }));
  },

  createProject: async (slug, name, key, description) => {
    const data = await apiFetch(`/workspaces/${slug}/projects`, {
      method: 'POST',
      body: JSON.stringify({ name, key, description }),
    });
    set((state) => ({
      projects: [...state.projects, data.project],
    }));
  },
}));
