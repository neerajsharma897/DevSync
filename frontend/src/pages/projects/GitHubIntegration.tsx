import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GitBranch, GitCommit, GitPullRequest, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const GitHubIntegration = () => {
  const { key } = useParams();
  const [activeTab, setActiveTab] = useState<'commits' | 'ci'>('commits');

  return (
    <div className="h-full flex flex-col font-sans bg-gray-950 text-gray-200">
      <div className="px-8 pt-8 pb-4 border-b border-gray-800/60 shrink-0">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <GitBranch className="w-6 h-6 mr-3 text-white" />
          GitHub Integration
        </h2>
        <p className="text-sm text-gray-400 mb-6">Track commits, pull requests, and CI/CD pipelines connected to tasks in {key}.</p>
        
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
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'commits' ? (
          <div className="space-y-4">
            {/* Fake Commit 1 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start space-x-4">
              <div className="mt-1 bg-gray-800 p-1.5 rounded text-gray-400">
                <GitCommit className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-gray-200">feat: implement drag and drop kanban</span>
                  <span className="bg-white/10 text-gray-300 border border-white/20 text-xs px-1.5 rounded">{key}-42</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center space-x-2">
                  <img src="https://github.com/github.png" alt="avatar" className="w-4 h-4 rounded-full opacity-50" />
                  <span>johndoe</span>
                  <span>•</span>
                  <span>committed 2 hours ago</span>
                </div>
              </div>
              <div className="text-sm font-mono text-gray-500">a1b2c3d</div>
            </div>

            {/* Fake PR */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start space-x-4">
              <div className="mt-1 bg-white/10 p-1.5 rounded text-white border border-white/20">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-gray-200">Fix authentication middleware layout</span>
                  <span className="bg-white/10 text-gray-300 border border-white/20 text-xs px-1.5 rounded">{key}-12</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="text-gray-300">#45 merged</span> into main by aliceweb
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Fake CI Run 1 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CheckCircle2 className="w-6 h-6 text-white" />
                <div>
                  <div className="text-sm font-bold text-gray-200 mb-0.5">Build & Test Frontend</div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span className="font-mono">main</span>
                    <span>•</span>
                    <span><GitCommit className="w-3 h-3 inline mr-1" />a1b2c3d</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">2m 45s</div>
                <div className="text-xs text-gray-500">Finished 10 mins ago</div>
              </div>
            </div>

            {/* Fake CI Run 2 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <XCircle className="w-6 h-6 text-red-500" />
                <div>
                  <div className="text-sm font-bold text-gray-200 mb-0.5">Backend Integration Tests</div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span className="font-mono">feat/auth</span>
                    <span>•</span>
                    <span><GitCommit className="w-3 h-3 inline mr-1" />9f8e7d6</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">45s</div>
                <div className="text-xs text-red-400">Failed 1 hr ago</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
