import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import KanbanBoard from '../components/kanban/KanbanBoard';
import BacklogView from '../components/kanban/BacklogView';
import SprintListView from '../components/kanban/SprintListView';
import ProjectMembersView from '../components/kanban/ProjectMembersView';
import ProjectSettingsView from '../components/kanban/ProjectSettingsView';
import GithubIntegrationView from '../components/kanban/GithubIntegrationView';
import { useProjectStore } from '../store/useProjectStore';
import { 
  Calendar, 
  Settings, 
  Layout, 
  Sparkles,
  Code,
  ListTodo,
  Users
} from 'lucide-react';

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('board');
  const { activeProject, projects, setActiveProject } = useProjectStore();

  useEffect(() => {
    if (id && projects.length > 0) {
      setActiveProject(id);
    }
  }, [id, projects, setActiveProject]);

  const tabs = [
    { id: 'board', label: 'Active Sprint', icon: <Layout size={14} /> },
    { id: 'backlog', label: 'Backlog', icon: <ListTodo size={14} /> },
    { id: 'sprints', label: 'Sprints', icon: <Calendar size={14} /> },
    { id: 'members', label: 'Members', icon: <Users size={14} /> },
    { id: 'github', label: 'GitHub', icon: <Code size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project Header */}
      <header className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-bg-tertiary to-bg-secondary border border-border-light text-accent-purple flex items-center justify-center shadow-inner">
               <span className="text-xl font-bold">{activeProject?.name.substring(0, 2).toUpperCase() || 'DP'}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{activeProject?.name || 'DevSync Platform'}</h1>
                <span className="px-2 py-0.5 rounded-md bg-white/5 text-white text-[10px] font-bold border border-white/10 flex items-center gap-1">
                   <div className={`w-1 h-1 rounded-full ${activeProject?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted'}`} />
                   {activeProject?.status || 'Active'}
                </span>
              </div>
              <p className="text-text-secondary text-sm mt-1">{activeProject?.description || 'Main platform repository & infrastructure management'}</p>
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

        {/* Navigation tabs */}
        <div className="flex items-center gap-1 border-b border-border-default/50 px-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/30'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-purple" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Dynamic Content Area */}
      <main className="flex-1 overflow-hidden p-8 pt-4">
        {activeTab === 'board' ? (
          <KanbanBoard />
        ) : activeTab === 'backlog' ? (
          <BacklogView />
        ) : activeTab === 'sprints' ? (
          <SprintListView />
        ) : activeTab === 'members' ? (
          <ProjectMembersView />
        ) : activeTab === 'github' ? (
          <GithubIntegrationView />
        ) : activeTab === 'settings' ? (
          <ProjectSettingsView />
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
