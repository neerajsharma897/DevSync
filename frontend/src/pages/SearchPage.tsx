import React, { useState } from 'react';
import { Search as SearchIcon, Layout, MessageSquare, Hash, FolderGit2 } from 'lucide-react';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'messages' | 'projects'>('all');

  const results: { tasks: any[], messages: any[], projects: any[] } = {
    tasks: [],
    messages: [],
    projects: []
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">Global Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, messages, projects, and people across all workspaces..."
            className="w-full bg-bg-tertiary/50 border border-border-default rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all shadow-lg text-lg"
            autoFocus
          />
        </div>
      </div>

      {query ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-2 mb-6 border-b border-border-default/50 pb-2">
            <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white text-black' : 'text-text-secondary hover:bg-bg-tertiary'}`}>All Results</button>
            <button onClick={() => setActiveTab('tasks')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-white text-black' : 'text-text-secondary hover:bg-bg-tertiary'}`}>Tasks</button>
            <button onClick={() => setActiveTab('messages')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'messages' ? 'bg-white text-black' : 'text-text-secondary hover:bg-bg-tertiary'}`}>Messages</button>
            <button onClick={() => setActiveTab('projects')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'projects' ? 'bg-white text-black' : 'text-text-secondary hover:bg-bg-tertiary'}`}>Projects</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
            {(activeTab === 'all' || activeTab === 'tasks') && (
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Tasks</h3>
                <div className="space-y-2">
                  {results.tasks.map(task => (
                    <div key={task.id} className="glass-card p-4 flex items-center gap-4 hover:bg-bg-hover cursor-pointer border border-border-default hover:border-accent-purple/30 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                        <Layout size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-text-secondary">{task.id}</span>
                          <span className="font-medium text-text-primary">{task.title}</span>
                        </div>
                        <div className="text-xs text-text-muted mt-1">in {task.project}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'messages') && (
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Messages</h3>
                <div className="space-y-2">
                  {results.messages.map(msg => (
                    <div key={msg.id} className="glass-card p-4 flex items-center gap-4 hover:bg-bg-hover cursor-pointer border border-border-default hover:border-accent-purple/30 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary text-sm mb-1">"{msg.content}"</p>
                        <div className="text-xs text-text-muted flex items-center gap-2">
                          <span className="font-bold text-text-secondary">{msg.author}</span>
                          in 
                          <span className="flex items-center gap-0.5"><Hash size={10} /> {msg.channel}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'projects') && (
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Projects</h3>
                <div className="space-y-2">
                  {results.projects.map(proj => (
                    <div key={proj.id} className="glass-card p-4 flex items-center gap-4 hover:bg-bg-hover cursor-pointer border border-border-default hover:border-accent-purple/30 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-purple flex items-center justify-center shrink-0">
                        <FolderGit2 size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm mb-0.5">{proj.name}</div>
                        <div className="text-xs font-mono text-text-muted">Key: {proj.key}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <SearchIcon size={48} className="mb-4 opacity-20" />
          <p>Type to search across everything in DevSync</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
