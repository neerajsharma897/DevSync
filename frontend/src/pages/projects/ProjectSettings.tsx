import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, GitBranch } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';

export const ProjectSettings = () => {
  const { slug, key } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await apiFetch(`/workspaces/${slug}/projects/${key}`);
        setName(data.project.name || '');
        setDescription(data.project.description || '');

        // RBAC Guard: Verify project_admin or workspace admin
        const { useCurrentWorkspaceStore } = await import('../../store/currentWorkspace.js');
        const { useAuthStore } = await import('../../store/auth.js');
        const isAdmin = useCurrentWorkspaceStore.getState().isAdmin();
        const currentUser = useAuthStore.getState().user;

        const membersData = await apiFetch(`/workspaces/${slug}/projects/${key}/members`);
        const members = membersData.members || [];
        const myMembership = members.find((m: any) => m.userId === currentUser?.userId);
        
        if (!isAdmin && myMembership?.role !== 'project_admin') {
          navigate(`/w/${slug}/projects/${key}`, { replace: true });
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug && key) loadProject();
  }, [slug, key, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch(`/workspaces/${slug}/projects/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
      });
      alert('Project updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('This project will be read-only. Members can still view but not edit. Proceed?')) return;
    try {
      await apiFetch(`/workspaces/${slug}/projects/${key}/archive`, { method: 'PATCH' });
      navigate(`/w/${slug}`);
    } catch (err: any) {
      alert(err.message || 'Failed to archive project.');
    }
  };

  if (isLoading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-8">Project Settings</h1>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-6">General Details</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Project Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Project Key</label>
              <input 
                type="text" 
                value={key}
                disabled
                className="w-full bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">The project key is immutable after creation.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800/60">
              <button onClick={handleSave} disabled={isSaving} className="flex items-center px-5 py-2.5 bg-gray-400 hover:bg-white text-white text-sm font-bold rounded-lg transition-colors">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center">
            <GitBranch className="w-5 h-5 mr-2 text-gray-400" />
            GitHub Connection
          </h2>
          <p className="text-sm text-gray-400 mb-6">Link this project to a GitHub repository to track commits and CI/CD status on your tasks.</p>
          
          <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-200">GitHub Details</h4>
                <p className="text-xs text-gray-500">Manage connections on the dedicated GitHub tab.</p>
              </div>
            </div>
            <button onClick={() => navigate(`/w/${slug}/projects/${key}/github`)} className="px-4 py-2 bg-white hover:bg-gray-200 text-gray-950 text-sm font-bold rounded-lg transition-colors">
              Go to GitHub Settings
            </button>
          </div>
        </div>

        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-500 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Archiving a project makes it read-only. Deleting a project permanently removes all tasks, sprints, and data.
          </p>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-950 border border-red-500/20 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-200">Archive Project</h4>
                <p className="text-xs text-gray-500">Freeze all activity. Can be restored later.</p>
              </div>
              <button onClick={handleArchive} className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm font-bold rounded-lg transition-colors">
                Archive Project
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
