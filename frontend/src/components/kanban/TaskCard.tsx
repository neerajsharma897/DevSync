import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { users } from '../../data/users';
import { 
  Clock, 
  MessageSquare, 
  MoreHorizontal
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleTaskClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  const assignee = users.find(u => u.id === task.assigneeId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleTaskClick}
      className={`glass-card p-4 hover:border-white/40 transition-all cursor-grab active:cursor-grabbing group animate-scaleIn ${
        isDragging ? 'opacity-50 border-white shadow-xl z-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
            task.priority === 'P0' ? 'priority-p0' : 
            task.priority === 'P1' ? 'priority-p1' : 
            task.priority === 'P2' ? 'priority-p2' : 'priority-p3'
          }`}>
            {task.priority}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-bg-elevated/50 text-text-muted text-[10px] font-medium border border-border-default/50">
            UI Kit
          </span>
        </div>
        <button className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-bg-hover transition-colors opacity-0 group-hover:opacity-100">
           <MoreHorizontal size={14} />
        </button>
      </div>

      <h4 className="text-[13px] font-semibold mb-3 leading-snug group-hover:text-white transition-colors line-clamp-2 min-h-[2.5em]">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-default/30">
        <div className="flex items-center gap-3 text-text-muted">
           <div className="flex items-center gap-1">
              <MessageSquare size={12} />
              <span className="text-[10px]">2</span>
           </div>
           {task.dueDate && (
             <div className="flex items-center gap-1">
                <Clock size={12} />
                <span className="text-[10px]">Apr 20</span>
             </div>
           )}
        </div>
        
        {assignee && (
           <div className="relative group/avatar">
              <img 
                src={assignee.avatar} 
                alt={assignee.fullName} 
                className="w-6 h-6 rounded-full border border-border-default hover:border-white transition-all"
              />
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-bg-elevated border border-border-default rounded text-[10px] whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none">
                {assignee.fullName}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
