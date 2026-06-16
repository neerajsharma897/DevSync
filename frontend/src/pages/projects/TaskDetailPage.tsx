import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { Loader2, ArrowLeft, MoreHorizontal, User, AlignLeft, MessageSquare, Activity, CheckCircle2, Trash2, X, Bug, BookOpen, Zap, CheckSquare, Layers, Send } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const STATUSES = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ISSUE_TYPES = [
  { value: 'epic', label: 'Epic' },
  { value: 'story', label: 'Story' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'subtask', label: 'Subtask' },
];

export const TaskDetailPage = () => {
  const { slug, key, taskKey } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);

  // Editable states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true);
      try {
        const [taskData, membersData] = await Promise.all([
          apiFetch(`/workspaces/${slug}/projects/${key}/tasks/${taskKey}`),
          apiFetch(`/workspaces/${slug}/projects/${key}/members`),
        ]);
        setTask(taskData.task);
        setEditTitle(taskData.task.title);
        setEditDesc(taskData.task.description || '');
        setMembers(membersData.members || []);
      } catch (err) {
        console.error('Failed to load task', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug && key && taskKey) fetchTask();
  }, [slug, key, taskKey]);

  const patchTask = async (fields: Record<string, any>) => {
    setIsSaving(true);
    try {
      await apiFetch(`/workspaces/${slug}/projects/${key}/tasks/${taskKey}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      });
      setTask((prev: any) => ({ ...prev, ...fields }));
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) return;
    try {
      await apiFetch(`/workspaces/${slug}/projects/${key}/tasks/${taskKey}`, { method: 'DELETE' });
      navigate(`/w/${slug}/projects/${key}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      patchTask({ title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDescSave = () => {
    if (editDesc !== (task.description || '')) {
      patchTask({ description: editDesc });
    }
    setIsEditingDesc(false);
  };

  const addLabel = () => {
    if (!labelInput.trim()) return;
    const currentLabels = task.labels || [];
    if (!currentLabels.includes(labelInput.trim())) {
      const newLabels = [...currentLabels, labelInput.trim()];
      patchTask({ labels: newLabels });
    }
    setLabelInput('');
  };

  const removeLabel = (label: string) => {
    const newLabels = (task.labels || []).filter((l: string) => l !== label);
    patchTask({ labels: newLabels });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-xl font-bold text-white mb-2">Task not found</h2>
        <button onClick={() => navigate(-1)} className="text-gray-300 hover:underline">Go back</button>
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
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleDeleteTask}
            className="text-sm font-medium px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-12 gap-8">
        
        {/* Main Left Content */}
        <div className="col-span-8 space-y-8">
          {/* Title Area — Click to edit */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setIsEditingTitle(false); }}
                  className="text-3xl font-bold text-gray-100 bg-transparent border-b-2 border-white/50 focus:outline-none flex-1"
                  autoFocus
                />
                <button onClick={handleTitleSave} className="text-sm text-white bg-white/20 px-3 py-1 rounded">Save</button>
                <button onClick={() => setIsEditingTitle(false)} className="text-sm text-gray-400 hover:text-white">Cancel</button>
              </div>
            ) : (
              <h1 
                className="text-3xl font-bold text-gray-100 mb-4 leading-snug cursor-pointer hover:text-white transition-colors"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
              >
                {task.title}
              </h1>
            )}
          </div>

          {/* Description — Click to edit */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-gray-300 font-semibold">
                <AlignLeft className="w-5 h-5" />
                <h3>Description</h3>
              </div>
              {!isEditingDesc && (
                <button onClick={() => setIsEditingDesc(true)} className="text-xs text-gray-500 hover:text-white transition-colors">
                  Edit
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-300 text-sm leading-relaxed focus:outline-none focus:border-white/50"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button onClick={handleDescSave} className="text-sm bg-white text-gray-950 px-4 py-1.5 rounded-lg font-bold hover:bg-gray-200">Save</button>
                  <button onClick={() => { setIsEditingDesc(false); setEditDesc(task.description || ''); }} className="text-sm text-gray-400 hover:text-white">Cancel</button>
                </div>
              </div>
            ) : (
              <div 
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 min-h-[100px] cursor-pointer hover:border-gray-700 transition-colors"
                onClick={() => setIsEditingDesc(true)}
              >
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {task.description || 'Click to add a description...'}
                </p>
              </div>
            )}
          </div>

          {/* Activity / Comments */}
          <div>
            <div className="flex items-center space-x-2 text-gray-300 font-semibold mb-4 border-b border-gray-800 pb-2">
              <Activity className="w-5 h-5" />
              <h3>Activity</h3>
            </div>
            
            {/* Comment input */}
            <div className="flex space-x-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-600 to-gray-500 flex items-center justify-center text-white text-xs font-bold shrink-0">ME</div>
              <div className="flex-1 flex space-x-2">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..." 
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      // Comment posting would go here
                      setCommentText('');
                    }
                  }}
                />
                <button 
                  disabled={!commentText.trim()}
                  className="px-3 py-2 bg-white text-gray-950 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* History item */}
            <div className="flex space-x-4 items-start">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="pt-1.5">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-gray-200">System</span> created this task
                </p>
                <span className="text-xs text-gray-500 mt-0.5 block">
                  {task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy h:mm a') : format(new Date(), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Details */}
        <div className="col-span-4 space-y-6">
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-5 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Details</h4>
            
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <select
                  value={task.status}
                  onChange={e => patchTask({ status: e.target.value })}
                  className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-sm font-semibold focus:outline-none"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Issue Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <select
                  value={task.type || 'task'}
                  onChange={e => patchTask({ type: e.target.value })}
                  className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                >
                  {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Priority</span>
                <select
                  value={task.priority}
                  onChange={e => patchTask({ priority: e.target.value })}
                  className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                >
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Assignee</span>
                <select
                  value={task.assigneeId || ''}
                  onChange={e => patchTask({ assigneeId: e.target.value || null })}
                  className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-sm focus:outline-none max-w-[160px]"
                >
                  <option value="">Unassigned</option>
                  {members.map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Due Date</span>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                  onChange={e => patchTask({ dueDate: e.target.value || null })}
                  className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                />
              </div>

              {/* Points */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Points</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={task.points || ''}
                  onChange={e => patchTask({ points: e.target.value ? parseInt(e.target.value) : null })}
                  className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-sm focus:outline-none w-16 text-right"
                  placeholder="—"
                />
              </div>

              {/* Labels */}
              <div>
                <span className="text-sm text-gray-500 block mb-2">Labels</span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(task.labels || []).map((label: string, idx: number) => (
                    <span key={idx} className="flex items-center bg-white/10 border border-white/20 text-gray-300 text-xs px-2 py-0.5 rounded">
                      {label}
                      <button onClick={() => removeLabel(label)} className="ml-1.5 text-gray-500 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={labelInput}
                    onChange={e => setLabelInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
                    className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                    placeholder="Add label..."
                  />
                  <button onClick={addLabel} className="text-xs text-gray-400 hover:text-white">Add</button>
                </div>
              </div>

              {/* Created / Updated */}
              <div className="pt-2 border-t border-gray-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-500">{task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Updated</span>
                  <span className="text-gray-500">{task.updatedAt ? format(new Date(task.updatedAt), 'MMM d, yyyy') : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
