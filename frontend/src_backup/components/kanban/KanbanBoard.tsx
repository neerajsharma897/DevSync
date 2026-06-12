import React from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { tasks as initialTasks } from '../../data/tasks';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskDetailPanel from './TaskDetailPanel';
import { Plus, Search, Filter } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(tasks.find((t) => t.id === active.id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = tasks.some((t) => t.id === activeId);
    const isOverATask = tasks.some((t) => t.id === overId);
    const isOverAColumn = COLUMNS.some((c) => c.id === overId);

    if (!isActiveATask) return;

    // Dropping over another task
    if (isActiveATask && isOverATask) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          const updatedTasks = [...prev];
          updatedTasks[activeIndex] = { ...updatedTasks[activeIndex], status: prev[overIndex].status };
          return arrayMove(updatedTasks, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Dropping over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const updatedTasks = [...prev];
        updatedTasks[activeIndex] = { ...updatedTasks[activeIndex], status: overId as TaskStatus };
        return arrayMove(updatedTasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveTask(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Board Header/Toolbar */}
      <div className="flex items-center justify-between mb-6 px-2">
         <div className="flex items-center gap-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
               <input 
                 type="text" 
                 placeholder="Filter tasks..." 
                 className="glass-input pl-9 pr-4 py-1.5 text-xs w-64 focus:glass-input-focus"
               />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default hover:border-white text-xs text-text-secondary transition-all">
               <Filter size={14} />
               <span>Filters</span>
            </button>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-7 h-7 rounded-full border-2 border-bg-primary bg-bg-tertiary flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                 </div>
               ))}
               <div className="w-7 h-7 rounded-full border-2 border-bg-primary bg-white text-black flex items-center justify-center text-[10px] font-bold">
                  +2
               </div>
            </div>
            <button className="gradient-btn px-4 py-1.5 text-xs flex items-center gap-2">
               <Plus size={14} />
               <span>New Task</span>
            </button>
         </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 flex-1 overflow-x-auto pb-4 scrollbar-hide">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter((t) => t.status === col.id)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>

        {selectedTask && (
          <TaskDetailPanel 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
          />
        )}
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
