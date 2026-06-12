import { create } from 'zustand';
import { apiFetch } from '../lib/api';
import { useWorkspaceStore } from './workspaceStore';

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'dm';
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface ChatState {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  isLoading: boolean;
  fetchChannels: () => Promise<void>;
  setActiveChannel: (id: string) => void;
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, body: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: [],
  isLoading: false,

  fetchChannels: async () => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    if (!workspace) return;

    set({ isLoading: true });
    try {
      const data = await apiFetch(`/workspaces/${workspace.slug}/channels`);
      
      const mappedChannels = data.channels.map((c: any) => ({
        id: c.channelId,
        name: c.name,
        type: c.type || 'public'
      }));

      set({ channels: mappedChannels, isLoading: false });
      
      if (mappedChannels.length > 0 && !get().activeChannel) {
        set({ activeChannel: mappedChannels[0] });
        get().fetchMessages(mappedChannels[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
      set({ isLoading: false });
    }
  },

  setActiveChannel: (id) => {
    const channel = get().channels.find(c => c.id === id);
    if (channel) {
      set({ activeChannel: channel });
      get().fetchMessages(id);
    }
  },

  fetchMessages: async (channelId) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    if (!workspace) return;

    try {
      const data = await apiFetch(`/workspaces/${workspace.slug}/channels/${channelId}/messages`);
      const mapped = data.messages.map((m: any) => ({
        id: m.messageId,
        channelId: m.channelId,
        senderId: m.senderId,
        body: m.content || m.body,
        createdAt: m.createdAt
      }));
      set({ messages: mapped });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  },

  sendMessage: async (channelId, body) => {
    const workspace = useWorkspaceStore.getState().currentWorkspace;
    if (!workspace) return;

    try {
      await apiFetch(`/workspaces/${workspace.slug}/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: body }),
      });
      // Re-fetch messages or let websockets handle it
      get().fetchMessages(channelId);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }
}));
