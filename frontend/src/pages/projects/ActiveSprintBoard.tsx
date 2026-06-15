import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BoardPage } from './BoardPage.js';
import { Target, Calendar, Clock, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ActiveSprintBoard = () => {
  const { slug, key } = useParams();
  const navigate = useNavigate();
  const [activeSprint, setActiveSprint] = useState<any>(null);

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const { apiFetch } = await import('../../lib/api.js');
        const data = await apiFetch(`/workspaces/${slug}/projects/${key}/sprints`);
        const sprint = data.sprints?.find((s: any) => s.status === 'active');
        setActiveSprint(sprint);
      } catch (err) {
        console.error('Failed to fetch sprints', err);
      }
    };
    if (slug && key) fetchSprints();
  }, [slug, key]);

  return (
    <div className="flex h-full flex-col font-sans">
      
      {/* Active Sprint Header */}
      {activeSprint && (
      <div className="bg-gray-900/80 border-b border-gray-800/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-xl font-bold text-white">{activeSprint.name}</h2>
            <span className="bg-white/10 border border-white/20 text-gray-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Active</span>
          </div>
          <div className="flex items-center text-sm text-gray-400 space-x-4">
            {activeSprint.goal && (
            <span className="flex items-center text-gray-300">
              <Target className="w-4 h-4 mr-1.5" />
              Goal: {activeSprint.goal}
            </span>
            )}
            {activeSprint.endDate && (
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              Ends {formatDistanceToNow(new Date(activeSprint.endDate), { addSuffix: true })}
            </span>
            )}
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-6">
          <div className="flex flex-col items-end">
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Sprint Progress</div>
            <div className="flex items-center space-x-3">
              <div className="w-32 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '65%' }}></div>
              </div>
              <span className="text-sm font-mono text-gray-300">65%</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700">
            Complete Sprint
          </button>
        </div>
      </div>
      )}

      {/* The actual Kanban Board component reused inside this container */}
      <div className="flex-1 overflow-x-auto relative bg-gray-950">
        <BoardPage />
      </div>
    </div>
  );
};
