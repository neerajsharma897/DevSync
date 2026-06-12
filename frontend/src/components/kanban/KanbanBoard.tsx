import React, { useEffect, useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types';
import { useTaskStore } from '../../store/useTaskStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useSprintStore } from '../../store/useSprintStore';
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
  const { tasks, fetchTasks, updateTaskStatus } = useTaskStore();
  const { activeProject } = useProjectStore();
  const { activeSprint, fetchSprints } = useSprintStore();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (activeProject) {
      fetchTasks();
      fetchSprints();
    }
  }, [activeProject, fetchTasks, fetchSprints]);

  // Filter tasks to only show ones in the active sprint
  const activeTasks = activeSprint ? tasks.filter(t => t.sprintId === activeSprint.id) : [];

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
    setActiveTask(activeTasks.find((t) => t.id === active.id) || null);
  };

  const handleDragOver = () => {
    // Only handling visual drag over right now, actual update is on end
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = activeTasks.some((t) => t.id === activeId);
    const isOverAColumn = COLUMNS.some((c) => c.id === overId);
    const overTask = activeTasks.find((t) => t.id === overId);

    if (!isActiveATask) return;

    if (isOverAColumn) {
      updateTaskStatus(activeId as string, overId as TaskStatus);
    } else if (overTask) {
      updateTaskStatus(activeId as string, overTask.status);
    }
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
              tasks={activeTasks.filter((t) => t.status === col.id)}
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
