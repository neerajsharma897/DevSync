import React, { useState } from 'react';
import { Search, Hash, FileEdit, FolderKanban } from 'lucide-react';

export const GlobalSearchResults = () => {
  const [query, setQuery] = useState('auth');
  
  // Fake search results mimicking Postgres tsvector match returns
  const results = [
    { type: 'task', id: 'DEV-12', title: 'Fix auth middleware bypass', context: 'Project: Backend Services', icon: FileEdit, color: 'text-blue-500' },
    { type: 'task', id: 'DEV-45', title: 'Implement OAuth providers', context: 'Project: Web App', icon: FileEdit, color: 'text-blue-500' },
    { type: 'message', id: 'msg-1', title: 'Alice in #engineering', context: 'I think the auth issue is in the new slug resolver.', icon: Hash, color: 'text-emerald-500' },
    { type: 'project', id: 'proj-1', title: 'Authentication Service', context: 'Workspace: Acme Corp', icon: FolderKanban, color: 'text-purple-500' },
  ];

  return (
    <div className="h-full flex flex-col font-sans bg-gray-950 text-gray-200">
      <div className="px-8 pt-8 pb-6 border-b border-gray-800/60 bg-gray-950 shrink-0">
        <div className="relative max-w-3xl">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, messages, projects..." 
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-gray-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-lg transition-all"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Search Results for "{query}"</h3>
          
          <div className="space-y-4">
            {results.map((res, idx) => (
              <div key={idx} className="flex items-start p-4 bg-gray-900/40 border border-gray-800/60 rounded-xl hover:bg-gray-800/40 cursor-pointer transition-colors group">
                <div className="mt-1 mr-4">
                  <div className={`w-10 h-10 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center ${res.color}`}>
                    <res.icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-200 group-hover:text-blue-400 transition-colors mb-1">
                    {res.title}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {res.context}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
