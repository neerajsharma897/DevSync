import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GitBranch, GitCommit, GitPullRequest, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export const GitHubIntegration = () => {
  const { slug, key } = useParams();
  const [activeTab, setActiveTab] = useState<'commits' | 'ci'>('commits');
  
  const [commits, setCommits] = useState<any[]>([]);
  const [ciRuns, setCiRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [branchFilter, setBranchFilter] = useState('all');
  const [showOnlyLinked, setShowOnlyLinked] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [commitsData, ciData] = await Promise.all([
        apiFetch(`/workspaces/${slug}/projects/${key}/github/commits`),
        apiFetch(`/workspaces/${slug}/projects/${key}/github/ci`)
      ]);
      setCommits(commitsData.commits || []);
      setCiRuns(ciData.runs || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch GitHub data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug && key) fetchData();
  }, [slug, key]);

  // Derived state for filters
  const uniqueBranches = Array.from(new Set(commits.map(c => c.branch).filter(Boolean)));

  let filteredCommits = commits;
  if (branchFilter !== 'all') {
    filteredCommits = filteredCommits.filter(c => c.branch === branchFilter);
  }
  if (showOnlyLinked) {
    filteredCommits = filteredCommits.filter(c => c.taskId);
  }

  let filteredCi = ciRuns;
  if (branchFilter !== 'all') {
    filteredCi = filteredCi.filter(c => c.branch === branchFilter);
  }
  if (showOnlyLinked) {
    filteredCi = filteredCi.filter(c => c.taskId);
  }

  return (
    <div className="h-full flex flex-col font-sans bg-gray-950 text-gray-200">
      <div className="px-8 pt-8 pb-4 border-b border-gray-800/60 shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center mb-1">
              <GitBranch className="w-6 h-6 mr-3 text-white" />
              GitHub Integration
            </h2>
            <p className="text-sm text-gray-400 mb-6">Track commits, pull requests, and CI/CD pipelines connected to tasks in {key}.</p>
          </div>
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-5 h-5", isLoading && "animate-spin")} />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('commits')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'commits' ? 'border-white text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              Recent Commits
            </button>
            <button 
              onClick={() => setActiveTab('ci')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ci' ? 'border-white text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              CI/CD Pipelines
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showOnlyLinked} 
                onChange={e => setShowOnlyLinked(e.target.checked)}
                className="rounded border-gray-700 bg-gray-900 text-white focus:ring-0 cursor-pointer"
              />
              <span>Linked to task only</span>
            </label>
            <select 
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-dashed border-red-500/30 bg-red-500/5 rounded-xl">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : activeTab === 'commits' ? (
          <div className="space-y-4">
            {filteredCommits.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                <p className="text-gray-500">No commits found.</p>
              </div>
            ) : (
              filteredCommits.map(commit => (
                <div key={commit.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start space-x-4 hover:border-gray-700 transition-colors">
                  <div className="mt-1 bg-gray-800 p-1.5 rounded text-gray-400">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-bold text-gray-200">{commit.message}</span>
                      {commit.taskId && (
                        <span className="bg-white/10 text-gray-300 border border-white/20 text-[10px] uppercase font-bold tracking-wider px-1.5 rounded">
                          {key}-{commit.taskId.split('-')[1] || commit.taskId}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span className="font-semibold text-gray-400">{commit.authorName}</span>
                      <span>•</span>
                      <span>committed {commit.createdAt ? formatDistanceToNow(new Date(commit.createdAt), { addSuffix: true }) : 'recently'}</span>
                      {commit.branch && (
                        <>
                          <span>•</span>
                          <span className="font-mono bg-gray-800 px-1 rounded">{commit.branch}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <a 
                    href={commit.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm font-mono text-gray-500 hover:text-white transition-colors"
                  >
                    {commit.sha?.substring(0, 7) || 'link'}
                  </a>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCi.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                <p className="text-gray-500">No CI/CD pipeline runs found.</p>
              </div>
            ) : (
              filteredCi.map(run => (
                <div key={run.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors">
                  <div className="flex items-center space-x-4">
                    {run.status === 'success' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2 mb-0.5">
                        <div className="text-sm font-bold text-gray-200">{run.name}</div>
                        {run.taskId && (
                          <span className="bg-white/10 text-gray-300 border border-white/20 text-[10px] uppercase font-bold tracking-wider px-1.5 rounded">
                            {key}-{run.taskId.split('-')[1] || run.taskId}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        {run.branch && <span className="font-mono">{run.branch}</span>}
                        {run.branch && <span>•</span>}
                        {run.commitSha && (
                          <span>
                            <GitCommit className="w-3 h-3 inline mr-1" />
                            {run.commitSha.substring(0, 7)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {run.duration && <div className="text-xs text-gray-500 mb-1">{run.duration}s</div>}
                    <div className={clsx("text-xs", run.status === 'failed' ? 'text-red-400' : 'text-gray-500')}>
                      {run.status === 'failed' ? 'Failed' : run.status === 'success' ? 'Finished' : 'Started'} {run.createdAt ? formatDistanceToNow(new Date(run.createdAt), { addSuffix: true }) : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
