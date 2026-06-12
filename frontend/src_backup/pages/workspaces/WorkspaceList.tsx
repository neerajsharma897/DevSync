import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace.js';
import { useAuthStore } from '../../store/auth.js';
import { Plus, Briefcase, ChevronRight, LogOut, Loader2, ServerCrash } from 'lucide-react';

export const WorkspaceList = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { workspaces, isLoading, fetchWorkspaces, createWorkspace } = useWorkspaceStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsSlug, setNewWsSlug] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName || !newWsSlug) return;
    
    setCreateLoading(true);
    try {
      await createWorkspace(newWsName, newWsSlug);
      setIsCreating(false);
      setNewWsName('');
      setNewWsSlug('');
      navigate(`/w/${newWsSlug}`);
    } catch (err) {
      console.error('Error creating workspace', err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <nav className="border-b border-gray-800/60 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
              <ServerCrash className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-xl tracking-tight">Dev<span className="text-emerald-400">Sync</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:inline-block">
              Signed in as <strong className="text-gray-200">{user?.email}</strong>
            </span>
            <button
              onClick={() => logout()}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Welcome back, {user?.fullName?.split(' ')[0] || 'Developer'}</h1>
            <p className="text-gray-400">Select a workspace to enter your team's hub.</p>
          </div>
          
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl transition-all duration-200 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Workspace
          </button>
        </div>

        {/* Creation Form Collapse */}
        {isCreating && (
          <div className="mb-10 bg-gray-900/60 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold text-white mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Workspace Name (e.g. Acme Corp)"
                  value={newWsName}
                  onChange={(e) => {
                    setNewWsName(e.target.value);
                    // Auto-generate slug
                    setNewWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex-1">
                <div className="flex bg-gray-950 border border-gray-800 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all overflow-hidden">
                  <span className="flex items-center px-4 bg-gray-900/50 text-gray-500 text-sm border-r border-gray-800">
                    devsync.com/w/
                  </span>
                  <input
                    type="text"
                    placeholder="acme-corp"
                    value={newWsSlug}
                    onChange={(e) => setNewWsSlug(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent outline-none text-white"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createLoading}
                className="px-6 py-3 bg-white text-gray-950 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[120px]"
              >
                {createLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
              </button>
            </form>
          </div>
        )}

        {/* Workspace Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/20 border border-gray-800/50 rounded-2xl border-dashed">
            <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300">No workspaces yet</h3>
            <p className="text-gray-500 mt-1">Create one or ask your admin for an invite.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <button
                key={ws.workspaceId}
                onClick={() => navigate(`/w/${ws.slug}`)}
                className="group relative flex flex-col text-left bg-gray-900/40 hover:bg-gray-800/60 border border-gray-800/60 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 overflow-hidden"
              >
                {/* Decorator */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-bl-full transition-opacity duration-500" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    ws.role === 'owner' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    ws.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    {ws.role.charAt(0).toUpperCase() + ws.role.slice(1)}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-100 group-hover:text-emerald-400 transition-colors">
                  {ws.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  devsync.com/w/{ws.slug}
                </p>

                <div className="mt-auto flex items-center text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                  Enter Workspace
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
