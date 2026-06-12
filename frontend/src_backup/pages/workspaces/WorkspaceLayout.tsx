import React, { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { Hash, Lock, Search, Bell, Settings, Plus, FolderKanban, Loader2, Home } from 'lucide-react';
import clsx from 'clsx';

export const WorkspaceLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { name, projects, channels, isLoading, error, fetchWorkspaceData } = useCurrentWorkspaceStore();

  useEffect(() => {
    if (slug) {
      fetchWorkspaceData(slug);
    }
  }, [slug, fetchWorkspaceData]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !name) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-950 text-white">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Workspace Error</h2>
        <p className="text-gray-400">{error || 'Workspace not found'}</p>
        <button onClick={() => navigate('/workspaces')} className="mt-6 text-emerald-400 hover:underline">
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-200 overflow-hidden font-sans">
      
      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800/60 flex flex-col flex-shrink-0">
        
        {/* Workspace Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-800/60 shadow-sm hover:bg-gray-800/50 cursor-pointer transition-colors">
          <h1 className="font-bold text-white truncate text-lg">{name}</h1>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 space-y-6">
          
          {/* Main Links */}
          <div className="px-3 space-y-0.5">
            <NavLink
              to={`/w/${slug}`}
              end
              className={({ isActive }) => clsx(
                "flex items-center px-2 py-1.5 rounded-md text-sm transition-colors group",
                isActive ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
              )}
            >
              <Home className="w-4 h-4 mr-2.5 opacity-70 group-hover:opacity-100" />
              Dashboard
            </NavLink>
            <button className="w-full flex items-center px-2 py-1.5 rounded-md text-sm text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 transition-colors group">
              <Search className="w-4 h-4 mr-2.5 opacity-70 group-hover:opacity-100" />
              Search
              <kbd className="ml-auto text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">⌘K</kbd>
            </button>
          </div>

          {/* Channels Section */}
          <div>
            <div className="px-5 mb-1.5 flex items-center justify-between group cursor-pointer">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Channels</span>
              <button className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-all">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-3 space-y-0.5">
              {channels.map((ch) => (
                <NavLink
                  key={ch.channelId}
                  to={`/w/${slug}/channels/${ch.channelId}`}
                  className={({ isActive }) => clsx(
                    "flex items-center px-2 py-1 rounded-md text-[15px] transition-colors",
                    isActive ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                  )}
                >
                  {ch.isPrivate ? (
                    <Lock className="w-3.5 h-3.5 mr-2 opacity-60" />
                  ) : (
                    <Hash className="w-4 h-4 mr-2 opacity-60" />
                  )}
                  <span className="truncate">{ch.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="px-5 mb-1.5 flex items-center justify-between group cursor-pointer">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Projects</span>
              <button className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-all">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-3 space-y-0.5">
              {projects.map((proj) => (
                <NavLink
                  key={proj.projectId}
                  to={`/w/${slug}/projects/${proj.key}`}
                  className={({ isActive }) => clsx(
                    "flex items-center px-2 py-1.5 rounded-md text-[14px] transition-colors",
                    isActive ? "bg-blue-500/10 text-blue-400 font-medium" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                  )}
                >
                  <FolderKanban className="w-4 h-4 mr-2.5 opacity-60" />
                  <span className="truncate">{proj.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

        </div>

        {/* User Profile Minimenu */}
        <div className="p-4 border-t border-gray-800/60">
          <div className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-gradient-to-tr from-emerald-500 to-blue-500"></div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">My Profile</span>
            </div>
            <Settings className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT OUTLET ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 relative">
        {/* Top Navbar / Utility Bar */}
        <header className="h-14 px-6 flex items-center justify-between border-b border-gray-800/60 bg-gray-950 shrink-0">
          <div className="flex items-center text-sm font-medium text-gray-400">
            {/* Breadcrumb or context can go here */}
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-gray-950"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Nested Content (Kanban, Chat, etc) */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

// Simple Chevron for the header
const ChevronDown = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
