import React, { useEffect, useState } from 'react';
import { useSprintStore } from '../../store/useSprintStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useProjectStore } from '../../store/useProjectStore';
import { Calendar, Plus, MoreVertical, Play, CheckCircle2, Clock } from 'lucide-react';

const SprintListView: React.FC = () => {
  const { sprints, fetchSprints, createSprint, updateSprintStatus } = useSprintStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { activeProject } = useProjectStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;
    await createSprint(newSprintName, newSprintGoal);
    setShowCreateModal(false);
    setNewSprintName('');
    setNewSprintGoal('');
  };

  const handleStartSprint = async (sprintId: string) => {
    await updateSprintStatus(sprintId, 'active');
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (confirm('Are you sure you want to complete this sprint?')) {
      await updateSprintStatus(sprintId, 'closed');
    }
  };

  const canManage = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin';

  return (
    <div className="flex-1 overflow-y-auto pr-2 pb-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Sprints</h2>
          <p className="text-sm text-text-secondary">Manage and plan your iterations</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="gradient-btn px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Sprint</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sprints.length === 0 ? (
          <div className="glass-card p-12 text-center text-text-muted flex flex-col items-center border border-dashed border-border-default">
            <Calendar className="w-12 h-12 mb-4 opacity-50" />
            <p>No sprints created yet.</p>
          </div>
        ) : (
          sprints.map(sprint => (
            <div key={sprint.id} className="glass-card border border-border-default overflow-hidden">
              <div className="p-5 flex items-start justify-between bg-bg-secondary/20">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{sprint.name}</h3>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                      sprint.status === 'active' ? 'bg-white/10 text-gray-300 border-white/30' :
                      sprint.status === 'closed' ? 'bg-white/10 text-gray-300 border-white/30' :
                      'bg-bg-tertiary text-text-muted border-border-default'
                    }`}>
                      {sprint.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary max-w-2xl">{sprint.goal || 'No goal provided for this sprint.'}</p>
                </div>

                <div className="flex items-center gap-3">
                  {canManage && sprint.status === 'future' && (
                    <button 
                      onClick={() => handleStartSprint(sprint.id)}
                      className="bg-bg-tertiary hover:bg-bg-hover text-text-primary px-4 py-1.5 rounded-lg text-sm font-medium border border-border-default flex items-center gap-2 transition-colors"
                    >
                      <Play size={14} className="text-gray-300" /> Start Sprint
                    </button>
                  )}
                  {canManage && sprint.status === 'active' && (
                    <button 
                      onClick={() => handleCompleteSprint(sprint.id)}
                      className="bg-bg-tertiary hover:bg-bg-hover text-text-primary px-4 py-1.5 rounded-lg text-sm font-medium border border-border-default flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle2 size={14} className="text-gray-300" /> Complete Sprint
                    </button>
                  )}
                  <button className="text-text-muted hover:text-white p-1">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-border-default/50 flex items-center gap-6 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'Unscheduled'} - {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'Unscheduled'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card-strong max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="text-accent-purple" size={20} /> Create Sprint
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase">Sprint Name</label>
                <input 
                  type="text" 
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm focus:border-accent-purple"
                  placeholder={`e.g. ${activeProject?.projectKey} Sprint 1`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase">Sprint Goal</label>
                <textarea 
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm focus:border-accent-purple h-20 resize-none"
                  placeholder="What do we want to achieve?"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-border-default">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 text-sm font-medium border border-border-default rounded-lg hover:bg-bg-hover">Cancel</button>
                <button type="submit" disabled={!newSprintName.trim()} className="flex-1 gradient-btn py-2 text-sm font-medium rounded-lg disabled:opacity-50">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintListView;
