import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { Play, CheckCircle2, Calendar, Target, Loader2, Plus } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface Sprint {
  sprintId: string;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'future' | 'active' | 'closed';
  taskCount: number;
}

export const SprintList = () => {
  const { slug, key } = useParams();
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSprints = async () => {
      setIsLoading(true);
      try {
        // Assume backend returns an array of sprints under this project
        const data = await apiFetch(`/workspaces/${slug}/projects/${key}/sprints`);
        setSprints(data.sprints || []);
      } catch (err) {
        console.error('Failed to load sprints', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug && key) fetchSprints();
  }, [slug, key]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const activeSprint = sprints.find(s => s.status === 'active');

  return (
    <div className="h-full p-8 font-sans overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Sprints</h2>
          <p className="text-gray-400 text-sm">Manage iterations and view historical velocity.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]">
          <Plus className="w-4 h-4 mr-2" />
          Create Sprint
        </button>
      </div>

      {activeSprint && (
        <div className="mb-10 bg-gradient-to-r from-blue-900/40 to-emerald-900/20 border border-blue-500/30 rounded-2xl p-6 shadow-lg shadow-blue-500/5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-md">
                Active Sprint
              </div>
              <h3 className="text-xl font-bold text-white">{activeSprint.name}</h3>
            </div>
            <button 
              onClick={() => navigate(`/w/${slug}/projects/${key}/sprints/active`)}
              className="text-sm font-semibold bg-white text-gray-950 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View Board
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-sm text-gray-300">
            <div className="flex items-center text-emerald-400">
              <Target className="w-4 h-4 mr-2" />
              <span className="font-medium text-gray-200">{activeSprint.goal || 'No sprint goal set'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              {activeSprint.startDate ? format(new Date(activeSprint.startDate), 'MMM d') : '-'} – {activeSprint.endDate ? format(new Date(activeSprint.endDate), 'MMM d, yyyy') : '-'}
            </div>
            <div className="flex items-center font-mono bg-gray-900 px-2 py-1 border border-gray-800 rounded">
              {activeSprint.taskCount} tasks
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-200 mb-4">All Sprints</h3>
        
        {sprints.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
            <p className="text-gray-500">No sprints created yet. Build your backlog and plan your first iteration.</p>
          </div>
        ) : (
          sprints.filter(s => s.status !== 'active').map(sprint => (
            <div key={sprint.sprintId} className="flex items-center justify-between p-5 bg-gray-900/50 border border-gray-800/60 rounded-xl hover:bg-gray-800/40 transition-colors">
              <div>
                <div className="flex items-center space-x-3 mb-1.5">
                  <h4 className="text-base font-bold text-gray-200">{sprint.name}</h4>
                  <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm",
                    sprint.status === 'closed' ? "bg-gray-800 text-gray-500" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  )}>
                    {sprint.status}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> 
                    {sprint.startDate ? format(new Date(sprint.startDate), 'MMM d') : 'Unscheduled'}
                  </span>
                  <span className="font-mono bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">{sprint.taskCount} tasks</span>
                </div>
              </div>

              {sprint.status === 'future' && (
                <button className="flex items-center text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors">
                  <Play className="w-4 h-4 mr-2 text-emerald-400" />
                  Start
                </button>
              )}
              {sprint.status === 'closed' && (
                <div className="flex items-center text-sm font-medium text-gray-500">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Completed
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
