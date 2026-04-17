import React, { useState } from 'react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { 
  Calendar, 
  Settings, 
  Layout, 
  Sparkles,
  Code
} from 'lucide-react';

const ProjectPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('board');

  const tabs = [
    { id: 'board', label: 'Board', icon: <Layout size={14} /> },
    { id: 'sprints', label: 'Sprints', icon: <Calendar size={14} /> },
    { id: 'github', label: 'GitHub', icon: <Code size={14} /> },
    { id: 'insights', label: 'Insights', icon: <Sparkles size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project Header */}
      <header className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-indigo flex items-center justify-center shadow-lg glow-purple">
               <span className="text-xl font-bold">DP</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">DevSync Platform</h1>
                <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-bold border border-success/20 flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
                   Active
                </span>
              </div>
              <p className="text-text-secondary text-sm mt-1">Main platform repository & infrastructure management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-bg-primary bg-bg-tertiary shadow-sm" />
                ))}
             </div>
             <button className="glass-card px-4 py-1.5 text-xs font-semibold hover:bg-bg-hover transition-colors">
                Share
             </button>
             <button className="gradient-btn px-4 py-1.5 text-xs">
                New Sprint
             </button>
          </div>
        </div>

        {/* GitHub-style navigation tabs */}
        <div className="flex items-center gap-1 border-b border-border-default/50 px-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative ${
                activeTab === tab.id 
                  ? 'text-accent-purple' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/30'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-purple shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Dynamic Content Area */}
      <main className="flex-1 overflow-hidden p-8 pt-4">
        {activeTab === 'board' ? (
          <KanbanBoard />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50 space-y-4">
             <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-border-default flex items-center justify-center">
                <Sparkles size={24} />
             </div>
             <p className="text-sm uppercase tracking-widest font-bold">Work in Progress</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectPage;
