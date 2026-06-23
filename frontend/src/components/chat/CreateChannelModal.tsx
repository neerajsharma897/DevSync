import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useChatStore } from '../../store/useChatStore';
import { apiFetch } from '../../lib/api';
import { Loader2, Hash, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateChannelModalProps {
  onClose: () => void;
  defaultType?: 'public' | 'private' | 'direct';
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose, defaultType = 'public' }) => {
  const { currentWorkspace } = useWorkspaceStore();
  const { fetchChannels } = useChatStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'direct'>(defaultType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const data = await apiFetch(`/workspaces/${currentWorkspace.slug}/channels`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim().toLowerCase().replace(/\s+/g, '-'),
          type,
        }),
      });
      await fetchChannels();
      onClose();
      navigate(`/chat/${data.channel.channelId}`);
    } catch (err) {
      console.error('Failed to create channel:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-bg-primary border border-border-default rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">Create a channel</h2>
          <p className="text-sm text-text-secondary mb-6">Channels are where your team communicates. They're best when organized around a topic — #marketing, for example.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {type === 'public' ? <Hash className="h-4 w-4 text-text-muted" /> : <Users className="h-4 w-4 text-text-muted" />}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-purple/50 transition-colors"
                  placeholder="e.g. plan-budget"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                Visibility
              </label>
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${type === 'public' ? 'border-accent-purple/50 bg-accent-purple/5' : 'border-border-default bg-bg-tertiary/50 hover:border-border-light'}`}>
                  <input 
                    type="radio" 
                    checked={type === 'public'} 
                    onChange={() => setType('public')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm text-text-primary">Public</div>
                    <div className="text-xs text-text-secondary mt-0.5">Anyone in the workspace can find and join this channel.</div>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${type === 'private' ? 'border-accent-purple/50 bg-accent-purple/5' : 'border-border-default bg-bg-tertiary/50 hover:border-border-light'}`}>
                  <input 
                    type="radio" 
                    checked={type === 'private'} 
                    onChange={() => setType('private')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm text-text-primary">Private</div>
                    <div className="text-xs text-text-secondary mt-0.5">Only invited members can view and join this channel.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="gradient-btn px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal;
