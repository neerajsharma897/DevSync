import { create } from 'zustand';
import { Project } from '../types';
import { apiFetch } from '../lib/api';
import { useWorkspaceStore } from './workspaceStore';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (project: Partial<Project>) => Promise<void>;
  setActiveProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  isLoading: false,

  fetchProjects: async () => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    if (!workspace) return;
    
    set({ isLoading: true });
    try {
      const data = await apiFetch(`/workspaces/${workspace.slug}/projects`);
      let mappedProjects = data.projects.map((p: any) => ({
        id: p.projectKey, // Using projectKey as id for frontend routing compatibility
        name: p.name,
        description: p.description || '',
        status: p.status || 'active',
        progress: 0,
        members: []
      }));

      set({ projects: mappedProjects, isLoading: false });
      
      if (mappedProjects.length > 0 && !get().activeProject) {
        set({ activeProject: mappedProjects[0] });
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      set({ isLoading: false });
    }
  },

  createProject: async (project) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    if (!workspace) return;

    try {
      await apiFetch(`/workspaces/${workspace.slug}/projects`, {
        method: 'POST',
        body: JSON.stringify({
          name: project.name,
          projectKey: (project as any).projectKey || project.name?.substring(0, 3).toUpperCase(),
          description: project.description
        }),
      });
      get().fetchProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  },

  setActiveProject: (id) => set((state) => ({
    activeProject: state.projects.find(p => p.id === id) || state.projects[0]
  })),
}));
