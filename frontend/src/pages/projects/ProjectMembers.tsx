import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, User, UserPlus, MoreHorizontal, Mail, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const ProjectMembers = () => {
  const { slug, key } = useParams();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState('developer');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { apiFetch } = await import('../../lib/api.js');
        const data = await apiFetch(`/workspaces/${slug}/projects/${key}/members`);
        setMembers(data.members || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug && key) fetchMembers();
  }, [slug, key]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    setIsAdding(true);
    try {
      const { apiFetch } = await import('../../lib/api.js');
      // First fetch workspace members to find the userId by email
      const wsData = await apiFetch(`/workspaces/${slug}/members`);
      const targetUser = wsData.members?.find((m: any) => m.email.toLowerCase() === targetEmail.toLowerCase());
      
      if (!targetUser) {
        alert("User not found in this workspace. Invite them to the workspace first.");
        setIsAdding(false);
        return;
      }

      // Now add them to the project
      await apiFetch(`/workspaces/${slug}/projects/${key}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: targetUser.userId, role: targetRole })
      });
      
      setShowModal(false);
      setTargetEmail('');
      // Re-fetch project members
      const data = await apiFetch(`/workspaces/${slug}/projects/${key}/members`);
      setMembers(data.members || []);
    } catch (err: any) {
      alert(err.message || 'Failed to add project member.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Project Members</h2>
          <p className="text-sm text-gray-400">Manage who has access to {key}.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-gray-400 hover:bg-white text-white font-bold rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Add Project Member</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Workspace Member Email</label>
                <input 
                  type="email" 
                  value={targetEmail}
                  onChange={e => setTargetEmail(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="name@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">User must already be a member of the workspace.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Project Role</label>
                <select 
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
                >
                  <option value="project_admin">Project Admin</option>
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={isAdding} className="px-6 py-2 bg-white text-gray-950 hover:bg-gray-200 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center">
                  {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add to Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Project Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {members.map(member => (
              <tr key={member.userId} className="hover:bg-gray-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-gray-500 to-gray-400 flex items-center justify-center text-white font-bold shadow-sm">
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
                  <div className="flex items-center text-sm">
                    {member.role === 'project_admin' && <Shield className="w-4 h-4 text-gray-300 mr-2" />}
                    {member.role === 'developer' && <Shield className="w-4 h-4 text-gray-300 mr-2" />}
                    {member.role === 'viewer' && <User className="w-4 h-4 text-gray-500 mr-2" />}
                    <span className={clsx("capitalize", 
                      member.role === 'project_admin' ? 'text-gray-300 font-medium' : 
                      member.role === 'developer' ? 'text-gray-300 font-medium' : 'text-gray-300'
                    )}>
                      {member.role.replace('_', ' ')}
                    </span>
                  </div>
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
      </div>
    </div>
  );
};
