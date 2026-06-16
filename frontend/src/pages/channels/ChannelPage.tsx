import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore.js';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { useAuthStore } from '../../store/auth.js';
import { TiptapEditor } from '../../components/chat/TiptapEditor.js';
import { Hash, Lock, Users, Loader2, Smile, MessageSquare, MoreHorizontal, X, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '../../lib/api.js';

export const ChannelPage = () => {
  const { slug, channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { channels, memberCount, isAdmin, fetchWorkspaceData } = useCurrentWorkspaceStore();
  const { messages, isLoading, joinChannel, leaveChannel, sendMessage } = useChatStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  
  const currentChannel = channels.find(c => c.channelId === channelId);

  // Thread State
  const [activeThreadMessageId, setActiveThreadMessageId] = useState<string | null>(null);
  const [threadReplies, setThreadReplies] = useState<any[]>([]);
  const [isThreadLoading, setIsThreadLoading] = useState(false);

  useEffect(() => {
    if (slug && channelId) {
      joinChannel(slug, channelId);
      setActiveThreadMessageId(null);
    }
    return () => leaveChannel();
  }, [slug, channelId, joinChannel, leaveChannel]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-scroll thread
  useEffect(() => {
    if (threadScrollRef.current) {
      threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight;
    }
  }, [threadReplies]);

  const loadThread = async (messageId: string) => {
    setActiveThreadMessageId(messageId);
    setIsThreadLoading(true);
    try {
      const data = await apiFetch(`/workspaces/${slug}/channels/${channelId}/messages/${messageId}/thread`);
      setThreadReplies(data.replies || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to load thread');
    } finally {
      setIsThreadLoading(false);
    }
  };

  const handleSendMain = async (content: string) => {
    if (slug && channelId) {
      await sendMessage(slug, channelId, content);
    }
  };

  const handleSendThread = async (content: string) => {
    if (slug && channelId && activeThreadMessageId) {
      try {
        const data = await apiFetch(`/workspaces/${slug}/channels/${channelId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content, threadId: activeThreadMessageId }),
        });
        setThreadReplies([...threadReplies, data.message]);
      } catch (err: any) {
        alert(err.message || 'Failed to send reply');
      }
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm('Delete message?')) return;
    try {
      await apiFetch(`/workspaces/${slug}/channels/${channelId}/messages/${msgId}`, { method: 'DELETE' });
      // Hack to refresh since chatStore doesn't expose deleteMessage
      joinChannel(slug as string, channelId as string);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteChannel = async () => {
    if (!confirm('Are you sure you want to delete this channel?')) return;
    try {
      await apiFetch(`/workspaces/${slug}/channels/${channelId}`, { method: 'DELETE' });
      fetchWorkspaceData(slug as string);
      navigate(`/w/${slug}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete channel');
    }
  };

  const handleUpdateChannelName = async () => {
    if (!currentChannel) return;
    const newName = prompt('Enter new channel name:', currentChannel.name);
    if (!newName || newName === currentChannel.name) return;
    
    try {
      await apiFetch(`/workspaces/${slug}/channels/${channelId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName })
      });
      fetchWorkspaceData(slug as string);
    } catch (err: any) {
      alert(err.message || 'Failed to update channel name');
    }
  };

  const renderMessage = (msg: any, isThreadContext = false) => {
    const isMe = msg.senderId === user?.userId;
    // Basic logic for headers (simplified for thread)
    const showHeader = true;

    return (
      <div key={msg.messageId} className="group flex items-start -mx-4 px-4 py-1 hover:bg-gray-900/40 rounded-lg transition-colors relative">
        <div className="w-10 flex-shrink-0 flex justify-center">
          {showHeader && (
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-gray-700 to-gray-500 flex items-center justify-center text-white font-bold shadow-md border border-gray-800">
              {msg.senderName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="ml-3 flex-1 min-w-0">
          {showHeader && (
            <div className="flex items-baseline space-x-2 mb-0.5">
              <span className="font-semibold text-gray-100">{msg.senderName || 'Unknown User'}</span>
              <span className="text-xs text-gray-500">{msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}</span>
            </div>
          )}
          
          <div 
            className="text-gray-300 text-[15px] leading-relaxed prose prose-invert max-w-none prose-p:my-0 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800"
            dangerouslySetInnerHTML={{ __html: msg.content }}
          />

          {!isThreadContext && msg.replyCount > 0 && (
            <div className="mt-2">
              <button 
                onClick={() => loadThread(msg.messageId)}
                className="flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
              </button>
            </div>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 bg-gray-900 border border-gray-800 rounded-md p-1 shadow-sm absolute right-6 -mt-3 transition-opacity">
          <button className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded"><Smile className="w-4 h-4" /></button>
          {!isThreadContext && (
            <button 
              onClick={() => loadThread(msg.messageId)}
              className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded" 
              title="Reply in thread"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          {isMe && (
            <button onClick={() => deleteMessage(msg.messageId)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded" title="Delete Message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  const parentMessage = messages.find(m => m.messageId === activeThreadMessageId);

  return (
    <div className="flex h-full bg-gray-950 font-sans overflow-hidden">
      
      {/* Main Channel Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <div className="h-14 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center">
            {currentChannel?.type === 'private' ? (
              <Lock className="w-5 h-5 text-gray-500 mr-2" />
            ) : (
              <Hash className="w-5 h-5 text-gray-500 mr-2" />
            )}
            <h2 className="font-bold text-gray-100 mr-2">{currentChannel?.name || 'Loading...'}</h2>
            {isAdmin() && (
              <button 
                onClick={handleUpdateChannelName}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="Edit Channel Name"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin() && (
              <button 
                onClick={handleDeleteChannel}
                className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
                title="Delete Channel"
              >
                Delete Channel
              </button>
            )}
            <div className="flex items-center text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
              <Users className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">{memberCount}</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 border border-gray-800">
                {currentChannel?.type === 'private' ? <Lock className="w-8 h-8" /> : <Hash className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">Welcome to #{currentChannel?.name}</h3>
              <p className="text-sm">This is the beginning of this channel's history.</p>
            </div>
          ) : (
            messages.map((msg) => renderMessage(msg, false))
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          <TiptapEditor onSubmit={handleSendMain} placeholder={`Message #${currentChannel?.name || 'channel'}`} />
        </div>
      </div>

      {/* Thread Panel */}
      {activeThreadMessageId && (
        <div className="w-96 border-l border-gray-800/60 bg-gray-900/50 flex flex-col shrink-0">
          <div className="h-14 border-b border-gray-800/60 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center">
              <h3 className="font-bold text-gray-100">Thread</h3>
              <span className="text-gray-500 text-sm ml-2">#{currentChannel?.name}</span>
            </div>
            <button onClick={() => setActiveThreadMessageId(null)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Original Message */}
            {parentMessage && (
              <div className="p-4 border-b border-gray-800/60 bg-gray-950/50">
                {renderMessage(parentMessage, true)}
              </div>
            )}
            
            {/* Replies */}
            <div ref={threadScrollRef} className="flex-1 p-4 space-y-6">
              {isThreadLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
              ) : threadReplies.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No replies yet. Start the conversation!
                </div>
              ) : (
                threadReplies.map((reply) => renderMessage(reply, true))
              )}
            </div>
          </div>

          {/* Thread Input Area */}
          <div className="p-4 bg-gray-950/80 border-t border-gray-800/60 shrink-0">
            <TiptapEditor onSubmit={handleSendThread} placeholder="Reply to thread..." />
          </div>
        </div>
      )}
    </div>
  );
};
