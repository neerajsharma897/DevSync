import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { GitBranch, GitCommit, PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

const GithubIntegrationView: React.FC = () => {
  const { activeProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'commits' | 'ci'>('commits');

  const commits: any[] = [];
  const ciRuns: any[] = [];

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><GitBranch size={20} /> GitHub Integration</h2>
          <p className="text-sm text-text-secondary">View commits and CI/CD runs linked to {activeProject?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border-default/50 px-2 shrink-0">
        <button 
          onClick={() => setActiveTab('commits')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'commits' ? 'border-accent-purple text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Recent Commits
        </button>
        <button 
          onClick={() => setActiveTab('ci')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ci' ? 'border-accent-purple text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          CI/CD Runs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8">
        {activeTab === 'commits' ? (
          <div className="space-y-3">
            {commits.map(commit => (
              <div key={commit.sha} className="glass-card p-4 border border-border-default flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 mt-1">
                  <GitCommit size={16} className="text-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-bg-tertiary px-1.5 py-0.5 rounded text-text-secondary">{commit.sha}</span>
                    <span className="text-sm font-medium">{commit.message}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">{commit.author}</span>
                    <span>committed on {new Date(commit.date).toLocaleDateString()}</span>
                    {commit.taskId && (
                      <span className="text-accent-purple bg-accent-purple/10 px-1.5 py-0.5 rounded ml-2">
                        {commit.taskId}
                      </span>
                    )}
                  </div>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium border border-border-default rounded hover:bg-bg-hover transition-colors">
                  View on GitHub
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {ciRuns.map(run => (
              <div key={run.id} className="glass-card p-4 border border-border-default flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {run.status === 'success' ? <CheckCircle2 size={20} className="text-white" /> :
                   run.status === 'failure' ? <XCircle size={20} className="text-red-500" /> :
                   <Clock size={20} className="text-amber-500" />}
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{run.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        run.status === 'success' ? 'bg-white/10 text-white' :
                        run.status === 'failure' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span><PlayCircle size={12} className="inline mr-1" />{run.id}</span>
                      <span>Duration: {run.duration}</span>
                      <span>{new Date(run.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubIntegrationView;
