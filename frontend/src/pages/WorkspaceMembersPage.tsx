import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch } from '../lib/api';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Shield, 
  Mail,
  Loader2
} from 'lucide-react';

interface Member {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
  state: 'active' | 'invited';
  joinedAt: string;
}

const WorkspaceMembersPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchMembers = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const data = await apiFetch(`/workspaces/${currentWorkspace.slug}/members`);
      setMembers(data.members || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !inviteEmail) return;
    
    setIsInviting(true);
    try {
      await apiFetch(`/workspaces/${currentWorkspace.slug}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setShowInviteModal(false);
      setInviteEmail('');
      fetchMembers(); // refresh
    } catch (err) {
      console.error('Failed to invite:', err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!currentWorkspace || !confirm('Are you sure you want to remove this member?')) return;
    try {
      await apiFetch(`/workspaces/${currentWorkspace.slug}/members/${userId}`, {
        method: 'DELETE',
      });
      setMembers(members.filter(m => m.userId !== userId));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentWorkspace) return;
    try {
      await apiFetch(`/workspaces/${currentWorkspace.slug}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setMembers(members.map(m => m.userId === userId ? { ...m, role: newRole as any } : m));
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canManage = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin';

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Workspace Members</h1>
          <p className="text-text-secondary text-sm">Manage who has access to {currentWorkspace?.name}</p>
        </div>
        
        {canManage && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="gradient-btn px-4 py-2 flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-default flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-tertiary/50 border border-border-default rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent-purple/50 transition-colors"
            />
          </div>
          <button className="px-3 py-2 border border-border-default rounded-lg text-sm flex items-center gap-2 hover:bg-bg-hover transition-colors">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-default/50 text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  {canManage && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/30">
                {filteredMembers.map((member) => (
                  <tr key={member.userId} className="hover:bg-bg-hover/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bg-tertiary border border-border-light flex items-center justify-center shrink-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full rounded-full" />
                          ) : (
                            <span className="font-bold text-sm">{member.fullName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary flex items-center gap-2">
                            {member.fullName}
                            {member.userId === user?.id && <span className="text-[10px] bg-accent-purple/20 text-accent-purple px-1.5 py-0.5 rounded uppercase font-bold">You</span>}
                          </div>
                          <div className="text-xs text-text-muted">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {member.role === 'owner' ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                            <Shield size={14} /> Owner
                          </span>
                        ) : (
                          canManage && member.userId !== user?.id ? (
                            <select 
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                              className="bg-bg-tertiary border border-border-default rounded text-xs px-2 py-1 outline-none focus:border-accent-purple/50"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                          ) : (
                            <span className="text-xs capitalize px-2 py-1 text-text-secondary">{member.role}</span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.state === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 bg-white/10 px-2 py-1 rounded">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                          <Mail size={12} />
                          Invited
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        {member.userId !== user?.id && member.role !== 'owner' && (
                          <button 
                            onClick={() => handleRemove(member.userId)}
                            className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/20 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card-strong max-w-md w-full p-6 animate-fadeIn">
            <h2 className="text-xl font-bold mb-2">Invite to Workspace</h2>
            <p className="text-sm text-text-secondary mb-6">Send an email invitation to collaborate on {currentWorkspace?.name}.</p>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent-purple/50 transition-colors"
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent-purple/50 transition-colors"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-border-default/50">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border-default hover:bg-bg-hover transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!inviteEmail || isInviting}
                  className="flex-1 gradient-btn px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceMembersPage;
