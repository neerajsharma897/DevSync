import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { apiFetch } from '../lib/api';
import { 
  Building2, 
  AlertTriangle,
  Loader2,
  Save,
  Trash2
} from 'lucide-react';

const WorkspaceSettingsPage: React.FC = () => {
  const { currentWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [slug, setSlug] = useState(currentWorkspace?.slug || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const isOwner = currentWorkspace?.role === 'owner';

  if (!isOwner) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-text-secondary">Only workspace owners can access these settings.</p>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    
    setIsSaving(true);
    try {
      await apiFetch(`/workspaces/${currentWorkspace.slug}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, slug }),
      });
      await fetchWorkspaces();
      // If slug changed, navigation might need a refresh or re-routing logic if we used slugs in URLs
    } catch (err) {
      console.error('Failed to update workspace:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspace || deleteConfirm !== currentWorkspace.name) return;
    
    setIsDeleting(true);
    try {
      await apiFetch(`/workspaces/${currentWorkspace.slug}`, {
        method: 'DELETE',
      });
      await fetchWorkspaces(); // Will auto-redirect or clear workspace
      navigate('/workspaces');
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Workspace Settings</h1>
        <p className="text-text-secondary text-sm mb-8">Manage your workspace configuration and preferences</p>

        <div className="space-y-8">
          {/* General Settings */}
          <section className="glass-card p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-accent-purple" />
              General Information
            </h2>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Workspace Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-purple/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Workspace URL Slug
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-border-default bg-bg-tertiary/50 text-text-muted text-sm">
                    devsync.com/
                  </span>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="flex-1 bg-bg-tertiary border border-border-default rounded-r-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-purple/50 transition-colors"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">This is your workspace's unique identifier. Changing this may break existing links.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving || (name === currentWorkspace?.name && slug === currentWorkspace?.slug)}
                  className="gradient-btn px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </section>

          {/* Danger Zone */}
          <section className="border border-red-500/20 bg-red-500/5 rounded-2xl p-8">
            <h2 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} />
              Danger Zone
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Deleting a workspace is a permanent action. It will delete all projects, tasks, messages, and associated data. This action cannot be undone.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Type <span className="font-bold text-red-400">{currentWorkspace?.name}</span> to confirm
                </label>
                <input 
                  type="text" 
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full max-w-md bg-bg-tertiary border border-red-500/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder={currentWorkspace?.name}
                />
              </div>

              <button 
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirm !== currentWorkspace?.name}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                <span>Delete Workspace</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettingsPage;
