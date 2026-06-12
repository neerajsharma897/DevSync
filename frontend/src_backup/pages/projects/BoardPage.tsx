import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBoardStore, Task, TaskStatus } from '../../store/boardStore.js';
import { Loader2, GripVertical, AlertCircle, MessageSquare, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-500' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-500' },
];

export const BoardPage = () => {
  const { slug, key } = useParams();
  const { tasks, isLoading, fetchTasks, updateTaskOptimistic, moveTask } = useBoardStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    if (slug && key) fetchTasks(slug, key);
  }, [slug, key, fetchTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.taskId === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handling cross-container movement optimistically can be complex in DndKit.
    // For a robust implementation, we handle the final move in DragEnd.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !slug || !key) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskData = tasks.find(t => t.taskId === activeId);
    if (!activeTaskData) return;

    // Check if dropping on a column directly
    const isOverColumn = COLUMNS.some(c => c.id === overId);
    const newStatus = isOverColumn ? (overId as TaskStatus) : tasks.find(t => t.taskId === overId)?.status || activeTaskData.status;
    
    if (activeTaskData.status === newStatus && activeId === overId) return;

    // Simplified ranking (In a real app, generate LexoRank between surrounding tasks)
    // For now, just generate a random string to simulate LexoRank behavior for UI updating
    const newRank = Math.random().toString(36).substring(2, 10);

    // Optimistic UI update
    updateTaskOptimistic(activeId, newStatus, newRank);

    // Network request
    moveTask(slug, key, activeTaskData.taskKey, newStatus, newRank);
  };

  return (
    <div className="h-full p-6 inline-flex items-start gap-6 relative min-w-full">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(col => {
          const columnTasks = tasks.filter(t => t.status === col.id);
          return (
            <KanbanColumn key={col.id} column={col} tasks={columnTasks} />
          );
        })}

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

// --- Column Component ---
const KanbanColumn = ({ column, tasks }: { column: any, tasks: Task[] }) => {
  return (
    <div className="flex flex-col w-80 shrink-0 bg-gray-900/50 rounded-xl border border-gray-800 max-h-full overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-gray-800/60 bg-gray-900/80">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${column.color}`}></div>
          <h3 className="font-semibold text-gray-200 text-sm">{column.title}</h3>
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
        <SortableContext items={tasks.map(t => t.taskId)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.taskId} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// --- Sortable Card Wrapper ---
const SortableTaskCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard task={task} />
    </div>
  );
};

// --- Presentational Card Component ---
const KanbanCard = ({ task, isOverlay = false }: { task: Task, isOverlay?: boolean }) => {
  return (
    <div className={clsx(
      "bg-gray-950 border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-colors group relative",
      isOverlay ? "border-blue-500/50 shadow-2xl shadow-blue-500/10 rotate-2 scale-105" : "border-gray-800 shadow-sm"
    )}>
      {/* Priority Indicator Line */}
      <div className={clsx("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", 
        task.priority === 'urgent' ? 'bg-red-500' :
        task.priority === 'high' ? 'bg-orange-500' :
        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
      )} />

      <div className="pl-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-gray-500 group-hover:text-gray-400 transition-colors">
            {task.taskKey}
          </span>
          {task.points && (
            <span className="text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
              {task.points}
            </span>
          )}
        </div>
        
        <p className="text-sm font-medium text-gray-200 mb-4 leading-snug line-clamp-2">
          {task.title}
        </p>

        {/* Card Footer */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {task.labels?.map((label, idx) => (
              <span key={idx} className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-500/50" title={label}></span>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center text-gray-500 text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              0
            </div>
            {task.assigneeId ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500 border border-gray-950 flex items-center justify-center text-[10px] text-white font-bold">
                U
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                ?
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
