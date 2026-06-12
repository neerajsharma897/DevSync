import React from 'react';
import { useParams } from 'react-router-dom';
import { Shield, User, UserPlus, MoreHorizontal, Mail } from 'lucide-react';
import clsx from 'clsx';

export const ProjectMembers = () => {
  const { key } = useParams();

  // Mocking data for UI completion
  const members = [
    { userId: '1', email: 'alice@example.com', fullName: 'Alice Admin', role: 'project_admin' },
    { userId: '2', email: 'bob@example.com', fullName: 'Bob Builder', role: 'developer' },
    { userId: '4', email: 'diana@example.com', fullName: 'Diana Designer', role: 'viewer' }
  ];

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Project Members</h2>
          <p className="text-sm text-gray-400">Manage who has access to {key}.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </button>
      </div>

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
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-700 to-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
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
                    {member.role === 'project_admin' && <Shield className="w-4 h-4 text-purple-400 mr-2" />}
                    {member.role === 'developer' && <Shield className="w-4 h-4 text-blue-400 mr-2" />}
                    {member.role === 'viewer' && <User className="w-4 h-4 text-gray-500 mr-2" />}
                    <span className={clsx("capitalize", 
                      member.role === 'project_admin' ? 'text-purple-400 font-medium' : 
                      member.role === 'developer' ? 'text-blue-400 font-medium' : 'text-gray-300'
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
