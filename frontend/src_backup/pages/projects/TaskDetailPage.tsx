import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { Task } from '../../store/boardStore.js';
import { Loader2, ArrowLeft, MoreHorizontal, User, AlignLeft, MessageSquare, Activity, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const TaskDetailPage = () => {
  const { slug, key, taskKey } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${slug}/projects/${key}/tasks/${taskKey}`);
        setTask(data.task);
      } catch (err) {
        console.error('Failed to load task', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug && key && taskKey) fetchTask();
  }, [slug, key, taskKey]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-xl font-bold text-white mb-2">Task not found</h2>
        <button onClick={() => navigate(-1)} className="text-blue-400 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-950 font-sans">
      
      {/* Top Breadcrumb & Actions */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-mono text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-800">{task.taskKey}</span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-sm font-medium px-3 py-1.5 bg-gray-900 border border-gray-800 text-gray-300 rounded hover:bg-gray-800 transition-colors">
            Share
          </button>
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-12 gap-8">
        
        {/* Main Left Content */}
        <div className="col-span-8 space-y-8">
          {/* Title Area */}
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-4 leading-snug">{task.title}</h1>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded hover:bg-blue-500/20 transition-colors text-sm font-semibold uppercase tracking-wide">
                <span>{task.status.replace('_', ' ')}</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center space-x-2 text-gray-300 font-semibold mb-3">
              <AlignLeft className="w-5 h-5" />
              <h3>Description</h3>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 min-h-[150px]">
              {/* Assuming task has a description, fallback to placeholder */}
              <p className="text-gray-400 text-sm leading-relaxed">
                {(task as any).description || 'No description provided for this task. Click to add one.'}
              </p>
            </div>
          </div>

          {/* Activity / Comments */}
          <div>
            <div className="flex items-center space-x-2 text-gray-300 font-semibold mb-4 border-b border-gray-800 pb-2">
              <Activity className="w-5 h-5" />
              <h3>Activity</h3>
            </div>
            
            {/* Fake comment input */}
            <div className="flex space-x-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">ME</div>
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            </div>
            
            {/* Fake history item */}
            <div className="flex space-x-4 items-start">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="pt-1.5">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-gray-200">System</span> created this task
                </p>
                <span className="text-xs text-gray-500 mt-0.5 block">{format(new Date(), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Details */}
        <div className="col-span-4 space-y-6">
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-5 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Details</h4>
            
            <div className="grid grid-cols-3 gap-y-4 text-sm">
              <div className="col-span-1 text-gray-500">Assignee</div>
              <div className="col-span-2 flex items-center space-x-2 text-gray-200">
                {task.assigneeId ? (
                  <><div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white">U</div> <span>User Assigned</span></>
                ) : (
                  <><User className="w-4 h-4 text-gray-500" /> <span className="italic text-gray-500">Unassigned</span></>
                )}
              </div>

              <div className="col-span-1 text-gray-500">Priority</div>
              <div className="col-span-2">
                <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded capitalize">{task.priority}</span>
              </div>

              <div className="col-span-1 text-gray-500">Points</div>
              <div className="col-span-2 text-gray-200">
                {task.points ? <span className="bg-gray-800 px-2 py-0.5 rounded font-mono">{task.points}</span> : '-'}
              </div>

              <div className="col-span-1 text-gray-500">Labels</div>
              <div className="col-span-2 flex flex-wrap gap-1">
                {task.labels?.map((label, idx) => (
                  <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded">
                    {label}
                  </span>
                )) || '-'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
