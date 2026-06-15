import React, { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { Hash, Lock, Search, Bell, Settings, Plus, FolderKanban, Loader2, Home, X } from 'lucide-react';
import clsx from 'clsx';

export const WorkspaceLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { name, projects, channels, isLoading, error, fetchWorkspaceData } = useCurrentWorkspaceStore();
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('public');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchWorkspaceData(slug);
    }
  }, [slug, fetchWorkspaceData]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !slug) return;
    setIsCreatingChannel(true);
    try {
      const { apiFetch } = await import('../../lib/api.js');
      await apiFetch(`/workspaces/${slug}/channels`, {
        method: 'POST',
        body: JSON.stringify({ name: newChannelName, type: newChannelType })
      });
      setShowChannelModal(false);
      setNewChannelName('');
      fetchWorkspaceData(slug);
    } catch (err: any) {
      alert(err.message || 'Failed to create channel.');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !name) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-950 text-white">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Workspace Error</h2>
        <p className="text-gray-400">{error || 'Workspace not found'}</p>
        <button onClick={() => navigate('/workspaces')} className="mt-6 text-gray-300 hover:underline">
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
                isActive ? "bg-white/10 text-gray-300 font-medium" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
              )}
            >
              <Home className="w-4 h-4 mr-2.5 opacity-70 group-hover:opacity-100" />
              Dashboard
            </NavLink>
            <button onClick={() => navigate(`/w/${slug}/search`)} className="w-full flex items-center px-2 py-1.5 rounded-md text-sm text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 transition-colors group">
              <Search className="w-4 h-4 mr-2.5 opacity-70 group-hover:opacity-100" />
              Search
              <kbd className="ml-auto text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">⌘K</kbd>
            </button>
          </div>

          {/* Channels Section */}
          <div>
            <div className="px-5 mb-1.5 flex items-center justify-between group cursor-pointer">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Channels</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChannelModal(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-all"
              >
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
                    isActive ? "bg-white/10 text-gray-300 font-medium" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
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
            <div className="px-5 mb-1.5 flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/w/${slug}/projects`)}>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Projects</span>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/w/${slug}/projects/new`); }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-all">
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
                    isActive ? "bg-white/10 text-gray-300 font-medium" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
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
        <div className="p-4 border-t border-gray-800/60" onClick={() => navigate(`/w/${slug}/settings`)}>
          <div className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-gradient-to-tr from-white to-white border border-gray-700"></div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Workspace Settings</span>
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
            <button onClick={() => navigate(`/w/${slug}/notifications`)} className="text-gray-400 hover:text-white transition-colors relative">
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

      {/* CREATE CHANNEL MODAL */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Create Channel</h3>
              <button onClick={() => setShowChannelModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Channel Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">#</span>
                  <input 
                    type="text" 
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-white transition-colors font-mono text-sm"
                    placeholder="general"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Visibility</label>
                <select 
                  value={newChannelType}
                  onChange={e => setNewChannelType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
                >
                  <option value="public">Public - Anyone in workspace</option>
                  <option value="private">Private - Invite only</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowChannelModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={isCreatingChannel} className="px-6 py-2 bg-white text-gray-950 hover:bg-gray-200 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center">
                  {isCreatingChannel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple Chevron for the header
const ChevronDown = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
