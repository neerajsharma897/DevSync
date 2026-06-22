import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitBranch, GitCommit, CheckCircle2, XCircle, Loader2, RefreshCw, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { useAuthStore } from '../../store/auth.js';


export const GitHubIntegration = () => {
  const { slug, key } = useParams();
  const [activeTab, setActiveTab] = useState<'commits' | 'ci'>('commits');
  
  const { isAdmin } = useCurrentWorkspaceStore();
  const currentUser = useAuthStore(state => state.user);
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);
  
  // Connection State
  const [connection, setConnection] = useState<any>(null);
  const [isConnLoading, setIsConnLoading] = useState(true);

  // Data State
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsTotal, setCommitsTotal] = useState(0);
  const [commitsPage, setCommitsPage] = useState(1);
  const [commitsTotalPages, setCommitsTotalPages] = useState(1);
  
  const [ciRuns, setCiRuns] = useState<any[]>([]);
  const [ciTotal, setCiTotal] = useState(0);
  const [ciPage, setCiPage] = useState(1);
  const [ciTotalPages, setCiTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState<string[]>([]);
  const [commitsLinkedFilter, setCommitsLinkedFilter] = useState('all'); // all, true, false
  const [ciConclusionFilter, setCiConclusionFilter] = useState('all');



  useEffect(() => {
    const fetchRole = async () => {
      try {
        const data = await apiFetch(`/workspaces/${slug}/projects/${key}/members`);
        const members = data.members || [];
        const myMembership = members.find((m: any) => m.userId === currentUser?.userId);
        setIsProjectAdmin(myMembership?.role === 'project_admin');
      } catch (err) {
        console.error('Failed to fetch project members for GitHub integration', err);
      }
    };
    if (slug && key) fetchRole();
  }, [slug, key, currentUser?.userId]);

  useEffect(() => {
    const fetchConnection = async () => {
      try {
        const data = await apiFetch(`/workspaces/${slug}/projects/${key}/github/connection`);
        setConnection(data.connection);
      } catch (err) {
        console.error('Failed to load GitHub connection', err);
      } finally {
        setIsConnLoading(false);
      }
    };
    if (slug && key) fetchConnection();
  }, [slug, key]);

  const fetchCommits = async (page = commitsPage) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/workspaces/${slug}/projects/${key}/github/commits?page=${page}&limit=25`;
      if (branchFilter !== 'all') url += `&branch=${encodeURIComponent(branchFilter)}`;
      if (commitsLinkedFilter !== 'all') url += `&linked=${commitsLinkedFilter}`;

      const res = await apiFetch(url);
      setCommits(res.commits || []);
      setCommitsTotal(res.totalCount || 0);
      setCommitsPage(res.page || 1);
      setCommitsTotalPages(res.totalPages || 1);
      setBranches(prev => Array.from(new Set([...prev, ...(res.branches || [])])));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commits');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCiRuns = async (page = ciPage) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/workspaces/${slug}/projects/${key}/github/ci?page=${page}&limit=25`;
      if (branchFilter !== 'all') url += `&branch=${encodeURIComponent(branchFilter)}`;
      if (ciConclusionFilter !== 'all') url += `&conclusion=${encodeURIComponent(ciConclusionFilter)}`;

      const res = await apiFetch(url);
      setCiRuns(res.runs || []);
      setCiTotal(res.totalCount || 0);
      setCiPage(res.page || 1);
      setCiTotalPages(res.totalPages || 1);
      setBranches(prev => Array.from(new Set([...prev, ...(res.branches || [])])));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch CI runs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!slug || !key) return;
    if (activeTab === 'commits') {
      fetchCommits(1);
    } else {
      fetchCiRuns(1);
    }
  }, [slug, key, activeTab, branchFilter, commitsLinkedFilter, ciConclusionFilter]);

  const handleRefresh = () => {
    if (activeTab === 'commits') fetchCommits(commitsPage);
    else fetchCiRuns(ciPage);
  };

  return (
    <div className="h-full flex flex-col font-sans bg-gray-950 text-gray-200">
      
      {/* Banner */}
      {!isConnLoading && !connection && (isAdmin() || isProjectAdmin) && (
        <div className="bg-blue-600 flex items-center justify-between px-6 py-3 text-white">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5" />
            <span className="font-semibold text-sm">No GitHub repository connected</span>
          </div>
          <Link 
            to={`/w/${slug}/projects/${key}/settings`} 
            className="bg-white text-blue-700 px-3 py-1.5 rounded text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            Connect a repository in Project Settings
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-800/60 shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center mb-1">
              <GitBranch className="w-6 h-6 mr-3 text-white" />
              GitHub Integration
            </h2>
            <p className="text-sm text-gray-400 mb-6">Track commits, pull requests, and CI/CD pipelines connected to tasks in {key}.</p>
          </div>
          <div className="flex items-center space-x-4">
            {connection && (
              <a 
                href={`https://github.com/${connection.githubRepoFullName}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center text-sm font-semibold text-gray-300 hover:text-white bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                {connection.githubRepoFullName}
                <ExternalLink className="w-4 h-4 ml-2 text-gray-500" />
              </a>
            )}
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-5 h-5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('commits')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'commits' ? 'border-white text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              Commits {commitsTotal > 0 && <span className="ml-1.5 bg-gray-800 text-gray-300 py-0.5 px-2 rounded-full text-xs">{commitsTotal}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('ci')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ci' ? 'border-white text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              CI Runs {ciTotal > 0 && <span className="ml-1.5 bg-gray-800 text-gray-300 py-0.5 px-2 rounded-full text-xs">{ciTotal}</span>}
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-2">
            {activeTab === 'commits' ? (
              <select 
                value={commitsLinkedFilter}
                onChange={e => setCommitsLinkedFilter(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Commits</option>
                <option value="true">Linked to Task</option>
                <option value="false">Unlinked</option>
              </select>
            ) : (
              <select 
                value={ciConclusionFilter}
                onChange={e => setCiConclusionFilter(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="success">Passed</option>
                <option value="failure">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
            
            <select 
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none max-w-[200px]"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-[1px] z-10 flex items-start justify-center pt-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {error ? (
          <div className="text-center py-12 border border-dashed border-red-500/30 bg-red-500/5 rounded-xl">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : activeTab === 'commits' ? (
          <div className="space-y-4 max-w-5xl">
            {commits.length === 0 && !isLoading ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                <GitCommit className="w-10 h-10 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-300 mb-1">No commits found</h3>
                <p className="text-gray-500 mb-4">
                  {connection ? `Commits will appear here when you push to ${connection.githubRepoFullName}` : 'Connect a repository to see commits.'}
                </p>
                <div className="bg-gray-900 inline-block px-4 py-2 rounded-lg text-sm border border-gray-800">
                  <span className="text-gray-400">💡 Mention task keys like </span>
                  <span className="font-mono text-gray-300">{key}-12</span>
                  <span className="text-gray-400"> in commit messages to link them.</span>
                </div>
              </div>
            ) : (
              <>
                <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900/80 border-b border-gray-800 text-xs font-semibold text-gray-400 tracking-wider">
                        <th className="px-4 py-3 w-24">SHA</th>
                        <th className="px-4 py-3">Message</th>
                        <th className="px-4 py-3 w-32">Task</th>
                        <th className="px-4 py-3 w-40">Author</th>
                        <th className="px-4 py-3 w-40">Branch</th>
                        <th className="px-4 py-3 w-32">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {commits.map(commit => (
                        <tr key={commit.id} className="hover:bg-gray-800/30 transition-colors group">
                          <td className="px-4 py-3">
                            <a 
                              href={commit.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-sm font-mono text-blue-400 hover:underline flex items-center"
                            >
                              <GitCommit className="w-3.5 h-3.5 mr-1 text-gray-500" />
                              {commit.commitSha?.substring(0, 7)}
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-200 line-clamp-1" title={commit.messageHeadline}>
                              {commit.messageHeadline}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {commit.taskId ? (
                              <Link to={`/w/${slug}/projects/${key}/tasks/${commit.taskKey}`} className="inline-flex bg-white/10 hover:bg-white/20 text-gray-300 border border-white/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded transition-colors">
                                {commit.taskKey}
                              </Link>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              {commit.authorAvatar ? (
                                <img src={commit.authorAvatar} alt="" className="w-5 h-5 rounded-full bg-gray-800" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-400">
                                  {(commit.authorName || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm text-gray-400 truncate max-w-[120px]">
                                {commit.authorName || commit.authorGithubLogin || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {commit.branchName ? (
                              <span className="font-mono text-xs bg-gray-800/80 text-gray-300 px-1.5 py-0.5 rounded truncate max-w-[140px] inline-block border border-gray-700/50">
                                {commit.branchName}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <span title={format(new Date(commit.committedAt), 'PPp')}>
                              {formatDistanceToNow(new Date(commit.committedAt), { addSuffix: true })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {commitsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-gray-500">
                      Showing {(commitsPage - 1) * 25 + 1} to {Math.min(commitsPage * 25, commitsTotal)} of {commitsTotal} commits
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => fetchCommits(commitsPage - 1)}
                        disabled={commitsPage === 1 || isLoading}
                        className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => fetchCommits(commitsPage + 1)}
                        disabled={commitsPage === commitsTotalPages || isLoading}
                        className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-5xl">
            {ciRuns.length === 0 && !isLoading ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                <CheckCircle2 className="w-10 h-10 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-300 mb-1">No workflow runs yet</h3>
                <p className="text-gray-500 mb-4">
                  {connection ? `CI runs will appear here when GitHub Actions workflows run on ${connection.githubRepoFullName}` : 'Connect a repository to see CI runs.'}
                </p>
                {connection && (
                  <div className="text-sm text-gray-400">
                    Make sure your repository has workflow files in <code className="bg-gray-800 px-1 rounded">.github/workflows/</code>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900/80 border-b border-gray-800 text-xs font-semibold text-gray-400 tracking-wider">
                        <th className="px-4 py-3">Workflow</th>
                        <th className="px-4 py-3 w-32">Status</th>
                        <th className="px-4 py-3 w-40">Branch</th>
                        <th className="px-4 py-3 w-24">Commit</th>
                        <th className="px-4 py-3 w-40">Started</th>
                        <th className="px-4 py-3 w-24 text-right">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {ciRuns.map(run => (
                        <tr key={run.id} className="hover:bg-gray-800/30 transition-colors group">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-200">{run.workflowName || 'Workflow'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5">
                              {run.status === 'in_progress' ? (
                                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center">
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running
                                </span>
                              ) : run.status === 'queued' ? (
                                <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  Queued
                                </span>
                              ) : run.conclusion === 'success' ? (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
                                </span>
                              ) : run.conclusion === 'failure' ? (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center">
                                  <XCircle className="w-3 h-3 mr-1" /> Failed
                                </span>
                              ) : run.conclusion === 'cancelled' ? (
                                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  Skipped
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {run.headBranch ? (
                              <span className="font-mono text-xs bg-gray-800/80 text-gray-300 px-1.5 py-0.5 rounded truncate max-w-[140px] inline-block border border-gray-700/50">
                                {run.headBranch}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {run.headSha ? (
                              <span className="text-sm font-mono text-gray-400 flex items-center">
                                <GitCommit className="w-3.5 h-3.5 mr-1" />
                                {run.headSha.substring(0, 7)}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <span title={format(new Date(run.triggeredAt), 'PPp')}>
                              {formatDistanceToNow(new Date(run.triggeredAt), { addSuffix: true })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {run.htmlUrl && (
                              <a 
                                href={run.htmlUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {ciTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-gray-500">
                      Showing {(ciPage - 1) * 25 + 1} to {Math.min(ciPage * 25, ciTotal)} of {ciTotal} runs
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => fetchCiRuns(ciPage - 1)}
                        disabled={ciPage === 1 || isLoading}
                        className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => fetchCiRuns(ciPage + 1)}
                        disabled={ciPage === ciTotalPages || isLoading}
                        className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
