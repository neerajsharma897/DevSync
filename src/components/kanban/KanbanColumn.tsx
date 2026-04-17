import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types';
import TaskCard from './TaskCard';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: {
    id: TaskStatus;
    title: string;
  };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onTaskClick }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col w-72 shrink-0 h-full">
      <div className="flex items-center justify-between mb-4 px-2 group">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest leading-none">
            {column.title}
          </h3>
          <span className="bg-bg-tertiary/60 px-2 py-0.5 rounded-full text-[10px] text-text-muted font-mono border border-border-default/50">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button className="text-text-muted hover:text-white p-1 rounded transition-colors">
              <Plus size={14} />
           </button>
           <button className="text-text-muted hover:text-text-primary p-1 rounded transition-colors">
              <MoreHorizontal size={14} />
           </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-3 p-2 rounded-2xl bg-bg-secondary/10 border border-transparent hover:border-border-default/30 transition-all overflow-y-auto"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted/30 border-2 border-dashed border-border-default/20 rounded-xl">
             <div className="w-10 h-10 rounded-full border border-dashed border-border-default mb-3" />
             <p className="text-[10px] uppercase font-bold tracking-tighter">Empty</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
