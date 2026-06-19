
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { Hash, FolderKanban, ArrowRight, Users, Shield } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';

export const WorkspaceHome = () => {
  const { slug } = useParams();
  const { name, description, projects, channels, myRole, memberCount, isAdmin, isOwner } = useCurrentWorkspaceStore();

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      member: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[role] || colors.member;
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 bg-gray-950 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Welcome to {name}</h1>
            <p className="text-gray-400 max-w-2xl mb-4">
              {description || "Here's what's happening in your workspace today. Jump back into your active projects or catch up on channel discussions."}
            </p>
            {/* Stats Row */}
            <div className="flex items-center space-x-6 text-sm">
              <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full border font-semibold text-xs uppercase tracking-wider", roleBadge(myRole))}>
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                {myRole}
              </span>
              <span className="flex items-center text-gray-400">
                <Users className="w-4 h-4 mr-1.5" />
                {memberCount} members
              </span>
              <span className="flex items-center text-gray-400">
                <FolderKanban className="w-4 h-4 mr-1.5" />
                {projects.length} projects
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <Link to={`/w/${slug}/projects`} className="px-4 py-2 bg-white hover:bg-gray-200 text-gray-950 rounded-lg text-sm font-semibold transition-colors">
            View All Projects
          </Link>
          <Link to={`/w/${slug}/notifications`} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
            View Notifications
          </Link>
          <Link to={`/w/${slug}/members`} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
            {isAdmin() ? 'Manage Members' : 'View Members'}
          </Link>
          {isOwner() && (
            <Link to={`/w/${slug}/settings`} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
              Workspace Settings
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projects Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-gray-200 font-bold">
              <FolderKanban className="w-5 h-5 text-gray-300" />
              <h3>Recent Projects</h3>
            </div>
            <Link to={`/w/${slug}/projects`} className="text-xs text-gray-500 hover:text-white transition-colors">View all →</Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 5).map(p => (
              <Link key={p.projectId} to={`/w/${slug}/projects/${p.key}`} className="group flex items-center justify-between p-3 bg-gray-950 border border-gray-800/80 hover:border-white/50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{p.key}</span>
                  <span className="font-medium text-gray-300 group-hover:text-white">{p.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
            {projects.length === 0 && <p className="text-sm text-gray-500 italic">No projects yet.</p>}
          </div>
        </div>

        {/* Channels Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-gray-200 font-bold">
              <Hash className="w-5 h-5 text-gray-300" />
              <h3>Channels</h3>
            </div>
          </div>
          <div className="space-y-3">
            {channels.slice(0, 5).map(c => (
              <Link key={c.channelId} to={`/w/${slug}/channels/${c.channelId}`} className="group flex items-center justify-between p-3 bg-gray-950 border border-gray-800/80 hover:border-white/50 rounded-lg transition-colors">
                <span className="font-medium text-gray-300 group-hover:text-white">#{c.name}</span>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
            {channels.length === 0 && <p className="text-sm text-gray-500 italic">No channels yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
