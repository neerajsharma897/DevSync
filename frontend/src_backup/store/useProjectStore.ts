import { create } from 'zustand';
import { Project } from '../types';
import { projects } from '../data/projects';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: projects,
  activeProject: projects[0],
  setActiveProject: (id) => set((state) => ({
    activeProject: state.projects.find(p => p.id === id) || state.projects[0]
  })),
}));
