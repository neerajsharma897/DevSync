import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../../store/boardStore.js';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { Search, Filter, Loader2, ChevronRight, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export const BacklogPage = () => {
  const { slug, key } = useParams();
  const navigate = useNavigate();
  const { tasks, isLoading, fetchTasks } = useBoardStore();

  useEffect(() => {
    if (slug && key) fetchTasks(slug, key);
  }, [slug, key, fetchTasks]);

  // Backlog usually consists of all tasks, or specifically TODO tasks.
  // For this view, we'll list all tasks in a robust table format.

  return (
    <div className="h-full flex flex-col p-6 font-sans">
      
      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search backlog..." 
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
          />
        </div>
        <button className="flex items-center text-sm text-gray-400 hover:text-gray-200 bg-gray-900 border border-gray-800 px-3 py-2 rounded-lg transition-colors">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-800 bg-gray-900/80 text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
          <div className="col-span-1">Key</div>
          <div className="col-span-5">Summary</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-1">Points</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p>No tasks in the backlog.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.taskId} 
                onClick={() => navigate(`/w/${slug}/projects/${key}/tasks/${task.taskKey}`)}
                className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors items-center group"
              >
                {/* Key */}
                <div className="col-span-1 text-sm font-mono text-gray-500 group-hover:text-gray-300 transition-colors">
                  {task.taskKey}
                </div>
                
                {/* Title */}
                <div className="col-span-5 text-sm font-medium text-gray-200 truncate pr-4">
                  {task.title}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span className={clsx(
                    "text-[11px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide",
                    task.status === 'TODO' ? "bg-gray-800 text-gray-400" :
                    task.status === 'IN_PROGRESS' ? "bg-white/10 text-gray-300" :
                    task.status === 'IN_REVIEW' ? "bg-white/10 text-gray-300" :
                    "bg-white/10 text-gray-300"
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Assignee */}
                <div className="col-span-2 flex items-center">
                  {task.assigneeId ? (
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-gray-900">
                      U
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 italic">Unassigned</span>
                  )}
                </div>

                {/* Points */}
                <div className="col-span-1">
                  {task.points ? (
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-gray-400">
                      {task.points}
                    </span>
                  ) : (
                    <span className="text-gray-700">-</span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  <button className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
