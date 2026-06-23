import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { Search, Shield, UserPlus } from 'lucide-react';

const ProjectMembersView: React.FC = () => {
  const { activeProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');

  const members: any[] = [];

  return (
    <div className="flex-1 overflow-y-auto pr-2 pb-8 h-full space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold">Project Members</h2>
          <p className="text-sm text-text-secondary">Manage who has access to {activeProject?.name}</p>
        </div>
        <button className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
          <UserPlus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      <div className="glass-card flex flex-col border border-border-default overflow-hidden">
        <div className="p-4 border-b border-border-default flex items-center gap-4 bg-bg-secondary/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search project members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-tertiary/50 border border-border-default rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent-purple/50"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-default/50 text-xs uppercase tracking-wider text-text-muted bg-bg-tertiary/10">
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/30">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-bg-hover/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-border-light flex items-center justify-center shrink-0">
                      <span className="font-bold text-xs">{member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-text-primary">{member.name}</div>
                      <div className="text-xs text-text-muted">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {member.role === 'project_admin' ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                        <Shield size={14} /> Admin
                      </span>
                    ) : (
                      <span className="text-xs capitalize px-2 py-1 text-text-secondary bg-bg-tertiary rounded">{member.role}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/20 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectMembersView;
