import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { Shield, User, UserPlus, MoreHorizontal, Mail, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Technically this data could come from useCurrentWorkspaceStore or a fresh API call.
        // We'll mock a fetch for the UI
        setIsLoading(false);
        setMembers([
          { userId: '1', email: 'alice@example.com', fullName: 'Alice Admin', role: 'owner', state: 'active', joinedAt: new Date().toISOString() },
          { userId: '2', email: 'bob@example.com', fullName: 'Bob Builder', role: 'member', state: 'active', joinedAt: new Date().toISOString() },
          { userId: '3', email: 'charlie@example.com', fullName: 'Charlie Dev', role: 'admin', state: 'invited', joinedAt: new Date().toISOString() }
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    if (slug) fetchMembers();
  }, [slug]);

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Workspace Members</h1>
          <p className="text-sm text-gray-400">Manage access and roles for your team.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-lg transition-colors shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Members
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
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
                      member.state === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    )}>
                      {member.state}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm">
                      {member.role === 'owner' && <Shield className="w-4 h-4 text-purple-400 mr-2" />}
                      {member.role === 'admin' && <Shield className="w-4 h-4 text-blue-400 mr-2" />}
                      {member.role === 'member' && <User className="w-4 h-4 text-gray-500 mr-2" />}
                      <span className={clsx("capitalize", member.role === 'owner' ? 'text-purple-400 font-medium' : 'text-gray-300')}>
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
