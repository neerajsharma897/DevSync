import React from 'react';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { Activity, Hash, FolderKanban, ArrowRight, Zap } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export const WorkspaceHome = () => {
  const { slug } = useParams();
  const { name, projects, channels } = useCurrentWorkspaceStore();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 bg-gray-950 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10">Welcome to {name}</h1>
        <p className="text-gray-400 relative z-10 max-w-2xl">
          Here's what's happening in your workspace today. Jump back into your active projects or catch up on channel discussions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Links Section */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 text-gray-200 font-bold mb-4">
              <FolderKanban className="w-5 h-5 text-blue-400" />
              <h3>Your Projects</h3>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 3).map(p => (
                <Link key={p.projectId} to={`/w/${slug}/projects/${p.key}`} className="group flex items-center justify-between p-3 bg-gray-950 border border-gray-800/80 hover:border-blue-500/50 rounded-lg transition-colors">
                  <span className="font-medium text-gray-300 group-hover:text-white">{p.name}</span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
              {projects.length === 0 && <p className="text-sm text-gray-500 italic">No projects yet.</p>}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 text-gray-200 font-bold mb-4">
              <Hash className="w-5 h-5 text-emerald-400" />
              <h3>Recent Channels</h3>
            </div>
            <div className="space-y-3">
              {channels.slice(0, 3).map(c => (
                <Link key={c.channelId} to={`/w/${slug}/channels/${c.channelId}`} className="group flex items-center justify-between p-3 bg-gray-950 border border-gray-800/80 hover:border-emerald-500/50 rounded-lg transition-colors">
                  <span className="font-medium text-gray-300 group-hover:text-white">#{c.name}</span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
              {channels.length === 0 && <p className="text-sm text-gray-500 italic">No channels yet.</p>}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-6">
          <div className="flex items-center space-x-2 text-gray-200 font-bold mb-6">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3>Workspace Activity</h3>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
            {/* Fake Activity Item 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-800 bg-gray-950 text-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <Zap className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-800 bg-gray-900/50">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-gray-200">Sprint 3 Started</div>
                  <time className="text-xs font-medium text-gray-500">2h ago</time>
                </div>
                <div className="text-sm text-gray-400">WebApp Overhaul sprint is now active.</div>
              </div>
            </div>

            {/* Fake Activity Item 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-800 bg-gray-950 text-blue-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-800 bg-gray-900/50">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-gray-200">New Project Created</div>
                  <time className="text-xs font-medium text-gray-500">1d ago</time>
                </div>
                <div className="text-sm text-gray-400">Mobile App V2 was initialized.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
