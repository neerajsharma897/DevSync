import React, { useState, useEffect } from 'react';
import { Search, Hash, FileEdit, FolderKanban } from 'lucide-react';
import { apiFetch } from '../lib/api.js';

export const GlobalSearchResults = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
        // Adapt data based on backend response shape
        const combinedResults = [
          ...(data.tasks || []).map((t: any) => ({
            type: 'task', id: t.taskId, title: t.title, context: `Project: ${t.projectName}`, icon: FileEdit, color: 'text-blue-400'
          })),
          ...(data.messages || []).map((m: any) => ({
            type: 'message', id: m.messageId, title: m.authorName, context: m.content, icon: Hash, color: 'text-green-400'
          }))
        ];
        setResults(combinedResults);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

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
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-gray-100 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 text-lg transition-all"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
            {query ? `Search Results for "${query}"` : 'Type to start searching'}
          </h3>
          
          {isLoading ? (
            <div className="text-gray-500">Searching...</div>
          ) : (
            <div className="space-y-4">
              {results.length === 0 && query ? (
                <div className="text-gray-500">No results found.</div>
              ) : (
                results.map((res, idx) => (
                  <div key={idx} className="flex items-start p-4 bg-gray-900/40 border border-gray-800/60 rounded-xl hover:bg-gray-800/40 cursor-pointer transition-colors group">
                    <div className="mt-1 mr-4">
                      <div className={`w-10 h-10 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center ${res.color}`}>
                        <res.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-200 group-hover:text-gray-300 transition-colors mb-1">
                        {res.title}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {res.context}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
