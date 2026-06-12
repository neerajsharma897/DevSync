import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { FolderKanban, Loader2 } from 'lucide-react';

export const CreateProjectPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { createProject } = useCurrentWorkspaceStore();
  
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !name || !key) return;
    
    setIsLoading(true);
    try {
      await createProject(slug, name, key, description);
      navigate(`/w/${slug}/projects/${key}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center items-center bg-gray-950 p-6 font-sans">
      <div className="w-full max-w-lg bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
            <FolderKanban className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">Create a New Project</h1>
        <p className="text-center text-gray-400 mb-8 text-sm">Start tracking tasks, sprints, and CI/CD pipelines.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!key) setKey(e.target.value.substring(0, 3).toUpperCase());
              }}
              placeholder="e.g. Mobile App V2"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Key</label>
            <input 
              type="text" 
              required
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. MOB"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 uppercase"
            />
            <p className="text-xs text-gray-500 mt-1.5">Used as a prefix for task IDs (e.g. MOB-1). Immutable after creation.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (Optional)</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-4">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading || !name || !key}
              className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
