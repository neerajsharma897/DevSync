import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { Building2, Plus, ArrowRight, Loader2, Sparkles } from 'lucide-react';

const WorkspacePickerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { workspaces, isLoading, fetchWorkspaces, createWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSelectWorkspace = (workspace: any) => {
    setCurrentWorkspace(workspace);
    navigate('/dashboard');
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const slug = newWorkspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newWs = await createWorkspace(newWorkspaceName, slug);
      setCurrentWorkspace(newWs);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-shape-1"></div>
      <div className="auth-shape-2"></div>

      <div className="glass-card-strong max-w-2xl w-full p-8 animate-fadeIn relative z-10 glow-purple">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold gradient-text mb-2">Welcome, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-text-secondary">
            {isCreating 
              ? "Let's set up your new workspace" 
              : "Select a workspace to continue or create a new one"}
          </p>
        </div>

        {isCreating ? (
          <form onSubmit={handleCreateWorkspace} className="max-w-md mx-auto space-y-6 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Workspace Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-bg-primary/50 border border-border-light rounded-xl text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple transition-all"
                  placeholder="Acme Corp"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 px-4 glass-card hover:bg-bg-hover transition-colors font-medium text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newWorkspaceName.trim()}
                className="flex-1 gradient-btn py-3 px-4 flex justify-center items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Create
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {workspaces.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-border-light rounded-2xl bg-bg-primary/20">
                <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No workspaces yet</h3>
                <p className="text-sm text-text-secondary mb-6">Create your first workspace to start collaborating.</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="gradient-btn px-6 py-2.5 inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>Create Workspace</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map((ws) => (
                  <button
                    key={ws.workspaceId}
                    onClick={() => handleSelectWorkspace(ws)}
                    className="glass-card p-6 text-left hover:-translate-y-1 hover:shadow-lg transition-all group flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-lg font-bold">{ws.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-text-primary group-hover:text-accent-purple transition-colors">{ws.name}</h3>
                      <p className="text-xs text-text-secondary mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-bg-tertiary uppercase text-[9px] font-bold tracking-wider">
                          {ws.role}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => setIsCreating(true)}
                  className="glass-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-bg-hover transition-colors border-dashed border-border-light text-text-secondary hover:text-text-primary"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium">Create New Workspace</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePickerPage;
