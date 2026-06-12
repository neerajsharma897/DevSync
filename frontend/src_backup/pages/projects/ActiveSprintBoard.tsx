import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BoardPage } from './BoardPage.js';
import { Target, Calendar, Clock, CheckSquare } from 'lucide-react';

export const ActiveSprintBoard = () => {
  const { slug, key } = useParams();
  const navigate = useNavigate();

  // In a real app, fetch active sprint details here.
  // For UI demonstration, we'll use a mocked active sprint header.

  return (
    <div className="flex h-full flex-col font-sans">
      
      {/* Active Sprint Header */}
      <div className="bg-gray-900/80 border-b border-gray-800/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-xl font-bold text-white">Sprint 3: WebApp Overhaul</h2>
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Active</span>
          </div>
          <div className="flex items-center text-sm text-gray-400 space-x-4">
            <span className="flex items-center text-emerald-400">
              <Target className="w-4 h-4 mr-1.5" />
              Goal: Migrate frontend to React 18 & Vite
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              Ends in 4 days
            </span>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-6">
          <div className="flex flex-col items-end">
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Sprint Progress</div>
            <div className="flex items-center space-x-3">
              <div className="w-32 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <span className="text-sm font-mono text-gray-300">65%</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700">
            Complete Sprint
          </button>
        </div>
      </div>

      {/* The actual Kanban Board component reused inside this container */}
      <div className="flex-1 overflow-x-auto relative bg-gray-950">
        <BoardPage />
      </div>
    </div>
  );
};
