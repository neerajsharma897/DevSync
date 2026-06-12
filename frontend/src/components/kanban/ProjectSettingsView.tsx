import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { Settings, Save, AlertTriangle, GitBranch } from 'lucide-react';

const ProjectSettingsView: React.FC = () => {
  const { activeProject } = useProjectStore();
  const [name, setName] = useState(activeProject?.name || '');
  const [description, setDescription] = useState(activeProject?.description || '');

  return (
    <div className="flex-1 overflow-y-auto pr-2 pb-8 h-full max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Project Settings</h2>
        <p className="text-sm text-text-secondary">Manage configuration for {activeProject?.projectKey}</p>
      </div>

      <div className="space-y-8">
        <section className="glass-card p-6 border border-border-default">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Settings size={16} className="text-accent-purple" /> General
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Project Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm focus:border-accent-purple"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 flex justify-between">
                Project Key
                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 rounded">Immutable</span>
              </label>
              <input 
                type="text" 
                value={activeProject?.id || ''}
                disabled
                className="w-24 bg-bg-primary border border-border-default rounded-lg px-3 py-2 text-sm text-text-muted cursor-not-allowed font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm focus:border-accent-purple h-20 resize-none"
              />
            </div>
            <div className="pt-2">
              <button type="button" className="gradient-btn px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2">
                <Save size={14} /> Save Changes
              </button>
            </div>
          </form>
        </section>

        <section className="glass-card p-6 border border-border-default">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <GitBranch size={16} /> Repository Integration
          </h3>
          <p className="text-xs text-text-secondary mb-4">Connect this project to a GitHub repository to track commits, PRs, and CI/CD pipelines.</p>
          <button className="bg-[#24292e] hover:bg-[#2f363d] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <GitBranch size={16} /> Connect GitHub Repository
          </button>
        </section>

        <section className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Danger Zone
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Archiving a project makes it read-only. Deleting it will permanently remove all tasks and data.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
              Archive Project
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
              Delete Project
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectSettingsView;
