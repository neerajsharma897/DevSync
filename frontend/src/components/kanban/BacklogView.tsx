import React, { useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useSprintStore } from '../../store/useSprintStore';
import { Plus, MoreVertical, GripVertical, AlertCircle } from 'lucide-react';

const BacklogView: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const { fetchSprints } = useSprintStore();

  useEffect(() => {
    fetchTasks();
    fetchSprints();
  }, [fetchTasks, fetchSprints]);

  // Tasks not assigned to any sprint
  const backlogTasks = tasks.filter(t => !t.sprintId);

  return (
    <div className="flex-1 overflow-y-auto pr-2 pb-8 h-full space-y-8">
      {/* Active/Future Sprints could also be shown here, but we will focus on Backlog as requested */}
      
      <div className="glass-card flex flex-col border border-border-default overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-bg-secondary/50">
          <div className="flex items-center gap-3">
            <h2 className="font-bold">Backlog</h2>
            <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">{backlogTasks.length} issues</span>
          </div>
          <button className="text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-medium bg-bg-tertiary hover:bg-bg-hover rounded-lg transition-colors">
            Create Sprint
          </button>
        </div>

        <div className="flex flex-col min-h-[100px]">
          {backlogTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border-default/50 m-4 rounded-xl text-text-muted">
              <p className="text-sm">Your backlog is empty.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-default/50">
              {backlogTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover/30 group transition-colors cursor-pointer">
                  <div className="text-text-muted cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={16} />
                  </div>
                  
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-amber-500' :
                    task.priority === 'medium' ? 'bg-white' : 'bg-text-muted'
                  }`} />
                  
                  <span className="text-xs font-mono text-text-secondary w-16">{task.taskKey}</span>
                  
                  <span className="text-sm text-text-primary flex-1 truncate font-medium group-hover:text-accent-purple transition-colors">
                    {task.title}
                  </span>

                  <div className="flex items-center gap-3">
                    {task.assigneeId ? (
                      <div className="w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple flex items-center justify-center text-[10px] font-bold border border-accent-purple/30">
                        {task.assigneeId.substring(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center border border-border-default text-text-muted">
                        <AlertCircle size={12} />
                      </div>
                    )}
                    
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                      task.status === 'done' ? 'border-white/30 text-gray-300 bg-white/10' :
                      task.status === 'in_progress' ? 'border-white/30 text-gray-300 bg-white/10' :
                      'border-border-light text-text-secondary bg-bg-tertiary'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    
                    <button className="text-text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button className="flex items-center gap-2 px-6 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover/30 transition-colors w-full border-t border-border-default">
            <Plus size={16} />
            <span>Create Issue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BacklogView;
