import { useState, useEffect } from 'react';
import { Search, Hash, FileEdit } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api.js';
import clsx from 'clsx';

export const GlobalSearchResults = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial query from URL, default to empty string
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() || !slug) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        // Backend returns: { results: [{ type: 'task', id, taskKey, title }, { type: 'message', id, bodyText }] }
        const data = await apiFetch(`/workspaces/${slug}/search?q=${encodeURIComponent(query)}`);
        
        const combinedResults = (data.results || []).map((res: any) => {
          if (res.type === 'task') {
            return {
              type: 'task',
              id: res.id,
              key: res.taskKey,
              title: res.title,
              context: `Task Key: ${res.taskKey}`,
              icon: FileEdit,
              color: 'text-blue-400',
              link: `/w/${slug}/projects/${res.taskKey.split('-')[0]}/tasks/${res.taskKey}` // Approximation of project key
            };
          } else {
            return {
              type: 'message',
              id: res.id,
              title: 'Message',
              context: res.bodyText,
              icon: Hash,
              color: 'text-green-400',
              link: null // Would need channelId to link properly, backend search doesn't return it currently
            };
          }
        });
        
        setResults(combinedResults);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Update URL query param when typing (debounced)
    const debounceTimer = setTimeout(() => {
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
      fetchResults();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [query, slug, setSearchParams]);

  // Apply filters
  let filteredResults = results;
  if (filterType !== 'all') {
    filteredResults = filteredResults.filter(r => r.type === filterType);
  }

  // Highlight matches
  const highlightQuery = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5 font-semibold">{part}</span> : part
        )}
      </span>
    );
  };

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
        
        {/* Filters */}
        <div className="max-w-3xl mt-4 flex items-center space-x-3">
          <button 
            onClick={() => setFilterType('all')}
            className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border", filterType === 'all' ? "bg-white/10 text-white border-white/20" : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200")}
          >
            All
          </button>
          <button 
            onClick={() => setFilterType('task')}
            className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border flex items-center", filterType === 'task' ? "bg-white/10 text-white border-white/20" : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200")}
          >
            <FileEdit className="w-3.5 h-3.5 mr-1.5" />
            Tasks
          </button>
          <button 
            onClick={() => setFilterType('message')}
            className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border flex items-center", filterType === 'message' ? "bg-white/10 text-white border-white/20" : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200")}
          >
            <Hash className="w-3.5 h-3.5 mr-1.5" />
            Messages
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
            {query ? `Search Results for "${query}"` : 'Type to start searching'}
          </h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start p-4 bg-gray-900/40 border border-gray-800/60 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 mr-4 shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.length === 0 && query ? (
                <div className="text-gray-500 py-8 text-center border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                  <Search className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  No results found for "{query}".
                </div>
              ) : (
                filteredResults.map((res, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => res.link && navigate(res.link)}
                    className={clsx(
                      "flex items-start p-4 bg-gray-900/40 border border-gray-800/60 rounded-xl transition-colors group",
                      res.link ? "hover:bg-gray-800/40 cursor-pointer" : "opacity-80"
                    )}
                  >
                    <div className="mt-1 mr-4">
                      <div className={`w-10 h-10 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center ${res.color}`}>
                        <res.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-200 group-hover:text-gray-100 transition-colors mb-1 truncate">
                        {highlightQuery(res.title, query)}
                      </h4>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {highlightQuery(res.context, query)}
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
