import { create } from 'zustand';
import { apiFetch } from '../lib/api.js';

export interface Workspace {
  workspaceId: string;
  name: string;
  slug: string;
  createdAt: string;
  role: 'owner' | 'admin' | 'member'; // Injected from workspace_members
  state: 'active' | 'invited' | 'deactivated';
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, slug: string) => Promise<Workspace>;
  acceptInvite: (slug: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch('/workspaces');
      set({ workspaces: data.workspaces || [], isLoading: false });
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
      set({ isLoading: false });
    }
  },

  createWorkspace: async (name, slug) => {
    const data = await apiFetch('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
    set((state) => ({
      workspaces: [...state.workspaces, { ...data.workspace, role: 'owner', state: 'active' }],
    }));
    return data.workspace;
  },

  acceptInvite: async (slug) => {
    await apiFetch(`/workspaces/${slug}/invites/accept`, { method: 'POST' });
    // Update local state to active
    set((state) => ({
      workspaces: state.workspaces.map(ws => ws.slug === slug ? { ...ws, state: 'active' } : ws)
    }));
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },
}));
