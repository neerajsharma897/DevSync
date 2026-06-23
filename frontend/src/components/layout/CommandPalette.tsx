import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, FileText, Hash, ArrowRight, Clock, X, CornerDownLeft } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';
import { formatDistanceToNow } from 'date-fns';

interface TaskResult {
  type: 'task';
  taskId: string;
  taskKey: string;
  title: string;
  status: string;
  projectKey: string;
  projectName: string;
}

interface MessageResult {
  type: 'message';
  messageId: string;
  channelId: string;
  bodyText: string;
  channelName: string;
  authorName: string;
  createdAt: string;
}

type SearchResult = TaskResult | MessageResult;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'devsync_recent_searches';

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter(s => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)));
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches] = useState(getRecentSearches);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || !slug) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${slug}/search?q=${encodeURIComponent(query.trim())}&limit=5`);
        const combined: SearchResult[] = [
          ...(data.tasks || []).map((t: any) => ({ ...t, type: 'task' as const })),
          ...(data.messages || []).map((m: any) => ({ ...m, type: 'message' as const })),
        ];
        setResults(combined);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, slug]);

  const navigateToResult = useCallback((result: SearchResult) => {
    addRecentSearch(query);
    onClose();
    if (result.type === 'task') {
      navigate(`/w/${slug}/projects/${result.projectKey}/tasks/${result.taskKey}`);
    } else {
      navigate(`/w/${slug}/channels/${result.channelId}`);
    }
  }, [query, slug, navigate, onClose]);

  const handleViewAll = useCallback(() => {
    if (query.trim()) {
      addRecentSearch(query);
      onClose();
      navigate(`/w/${slug}/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, slug, navigate, onClose]);

  const handleRecentClick = useCallback((term: string) => {
    onClose();
    navigate(`/w/${slug}/search?q=${encodeURIComponent(term)}`);
  }, [slug, navigate, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length)); // +1 for "View All"
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length === 0 || selectedIndex === results.length) {
        handleViewAll();
      } else {
        navigateToResult(results[selectedIndex]);
      }
      return;
    }
  }, [results, selectedIndex, handleViewAll, navigateToResult, onClose]);

  if (!isOpen) return null;

  const taskResults = results.filter(r => r.type === 'task') as TaskResult[];
  const messageResults = results.filter(r => r.type === 'message') as MessageResult[];

  // Flatten into ordered list for index tracking
  let flatIndex = 0;
  const getAndIncrement = () => flatIndex++;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'scaleIn 0.15s ease-out forwards' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-5 border-b border-gray-800">
          <Search className="w-5 h-5 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, messages..."
            className="flex-1 bg-transparent border-none py-4 px-3 text-base text-gray-100 placeholder:text-gray-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="ml-2 text-[10px] bg-gray-800 px-2 py-1 rounded border border-gray-700 text-gray-500 font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Loading */}
          {isLoading && (
            <div className="px-5 py-6 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-700 border-t-gray-300 rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Searching...</span>
            </div>
          )}

          {/* No query — show recent searches */}
          {!query.trim() && !isLoading && (
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Recent Searches</p>
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(term)}
                      className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800/70 transition-colors group"
                    >
                      <Clock className="w-4 h-4 text-gray-600 mr-3 shrink-0" />
                      <span className="truncate">{term}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-600 text-center py-6">Type to search across tasks and messages</p>
              )}
            </div>
          )}

          {/* Has query but no results and not loading */}
          {query.trim().length >= 2 && !isLoading && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <Search className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No results for "{query}"</p>
              <p className="text-xs text-gray-600 mt-1">Try fewer or different keywords</p>
            </div>
          )}

          {/* Results list */}
          {!isLoading && results.length > 0 && (() => { flatIndex = 0; return true; })() && (
            <div className="py-2">
              {/* Tasks Section */}
              {taskResults.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-5 py-1.5">Tasks</p>
                  {taskResults.map(task => {
                    const idx = getAndIncrement();
                    return (
                      <button
                        key={task.taskId}
                        onClick={() => navigateToResult(task)}
                        className={`w-full flex items-center px-5 py-2.5 text-left transition-colors group ${
                          selectedIndex === idx ? 'bg-gray-800/80' : 'hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center mr-3 shrink-0">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-gray-500 shrink-0">{task.taskKey}</span>
                            <span className="text-sm text-gray-200 truncate">{task.title}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-gray-600 font-mono ml-3 shrink-0">{task.projectKey}</span>
                        {selectedIndex === idx && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-gray-500 ml-2 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Messages Section */}
              {messageResults.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-5 py-1.5 mt-1">Messages</p>
                  {messageResults.map(msg => {
                    const idx = getAndIncrement();
                    return (
                      <button
                        key={msg.messageId}
                        onClick={() => navigateToResult(msg)}
                        className={`w-full flex items-center px-5 py-2.5 text-left transition-colors group ${
                          selectedIndex === idx ? 'bg-gray-800/80' : 'hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center mr-3 shrink-0">
                          <Hash className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 shrink-0">#{msg.channelName}</span>
                            <span className="text-sm text-gray-300 truncate">{msg.bodyText?.substring(0, 80)}</span>
                          </div>
                        </div>
                        {msg.createdAt && (
                          <span className="text-[11px] text-gray-600 ml-3 shrink-0">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </span>
                        )}
                        {selectedIndex === idx && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-gray-500 ml-2 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* View All Results */}
              <div className="border-t border-gray-800 mt-1">
                <button
                  onClick={handleViewAll}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm transition-colors ${
                    selectedIndex === results.length ? 'bg-gray-800/80 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    View all results for "{query}"
                  </span>
                  <div className="flex items-center gap-1">
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-5 py-2.5 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">↵</kbd>
                to open
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">esc</kbd>
              to close
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
