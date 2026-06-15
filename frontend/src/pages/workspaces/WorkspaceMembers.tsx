import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { Shield, User, UserPlus, MoreHorizontal, Mail, Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface Member {
  userId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'member';
  state: 'active' | 'invited';
  joinedAt: string;
}

export const WorkspaceMembers = () => {
  const { slug } = useParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await apiFetch(`/workspaces/${slug}/members`);
        // Assume API returns members array matching the shape, map if needed
        setMembers(data.members || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchMembers();
  }, [slug]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await apiFetch(`/workspaces/${slug}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      setShowModal(false);
      setInviteEmail('');
      // Re-fetch members
      const data = await apiFetch(`/workspaces/${slug}/members`);
      setMembers(data.members || []);
    } catch (err: any) {
      alert(err.message || 'Failed to invite member.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Workspace Members</h1>
          <p className="text-sm text-gray-400">Manage access and roles for your team.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-white hover:bg-gray-300 text-gray-950 font-bold rounded-lg transition-colors shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Members
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Invite Member</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={isInviting} className="px-6 py-2 bg-white text-gray-950 hover:bg-gray-200 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center">
                  {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {members.map(member => (
                <tr key={member.userId} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-200">{member.fullName}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border",
                      member.state === 'active' ? "bg-white/10 text-gray-300 border-white/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    )}>
                      {member.state}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm">
                      {member.role === 'owner' && <Shield className="w-4 h-4 text-gray-300 mr-2" />}
                      {member.role === 'admin' && <Shield className="w-4 h-4 text-gray-300 mr-2" />}
                      {member.role === 'member' && <User className="w-4 h-4 text-gray-500 mr-2" />}
                      <span className={clsx("capitalize", member.role === 'owner' ? 'text-gray-300 font-medium' : 'text-gray-300')}>
                        {member.role}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
