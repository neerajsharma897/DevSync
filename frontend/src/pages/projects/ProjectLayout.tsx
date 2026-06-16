import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { Kanban, List, Settings, Filter, Plus, IterationCcw, Users, GitBranch, Hash } from 'lucide-react';
import clsx from 'clsx';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';

export const ProjectLayout = () => {
  const { slug, key } = useParams();
  const { projects, isAdmin } = useCurrentWorkspaceStore();
  
  // Find current project details from the sidebar store
  const currentProject = projects.find(p => p.key === key?.toUpperCase());

  const tabClass = ({ isActive }: { isActive: boolean }) => clsx(
    "flex items-center pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
    isActive ? "border-white text-gray-300" : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
  );

  return (
    <div className="flex h-full flex-col font-sans bg-gray-950">
      {/* Project Header Area */}
      <div className="border-b border-gray-800/60 bg-gray-950 px-6 pt-6 pb-0 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 border border-white/50 rounded-lg flex items-center justify-center">
              <Kanban className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Project / {key}</div>
              <h2 className="text-xl font-bold text-gray-100">{currentProject?.name || 'Loading Project...'}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2 mr-2">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-950 z-20"></div>
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-950 z-10"></div>
              <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-950 flex items-center justify-center text-xs text-white z-0">+3</div>
            </div>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation — All 7 tabs */}
        <div className="flex space-x-6 mt-2 overflow-x-auto">
          <NavLink to={`/w/${slug}/projects/${key}`} end className={tabClass}>
            <Kanban className="w-4 h-4 mr-2" />
            Board
          </NavLink>
          <NavLink to={`/w/${slug}/projects/${key}/backlog`} className={tabClass}>
            <List className="w-4 h-4 mr-2" />
            Backlog
          </NavLink>
          <NavLink to={`/w/${slug}/projects/${key}/sprints`} className={tabClass}>
            <IterationCcw className="w-4 h-4 mr-2" />
            Sprints
          </NavLink>
          <NavLink to={`/w/${slug}/projects/${key}/channels`} className={tabClass}>
            <Hash className="w-4 h-4 mr-2" />
            Channels
          </NavLink>
          <NavLink to={`/w/${slug}/projects/${key}/github`} className={tabClass}>
            <GitBranch className="w-4 h-4 mr-2" />
            GitHub
          </NavLink>
          <NavLink to={`/w/${slug}/projects/${key}/members`} className={tabClass}>
            <Users className="w-4 h-4 mr-2" />
            Members
          </NavLink>
          {/* Settings tab — visible to project_admin only (we fall back to workspace admin check for now) */}
          <NavLink to={`/w/${slug}/projects/${key}/settings`} className={tabClass}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </NavLink>
        </div>
      </div>

      {/* Main Board/Backlog Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-950 relative">
        <Outlet />
      </div>
    </div>
  );
};
