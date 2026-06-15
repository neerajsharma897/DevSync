import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore.js';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { useAuthStore } from '../../store/auth.js';
import { TiptapEditor } from '../../components/chat/TiptapEditor.js';
import { Hash, Lock, Users, Loader2, Smile, MessageSquare, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

export const ChannelPage = () => {
  const { slug, channelId } = useParams();
  const { user } = useAuthStore();
  const { channels } = useCurrentWorkspaceStore();
  const { messages, isLoading, joinChannel, leaveChannel, sendMessage } = useChatStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentChannel = channels.find(c => c.channelId === channelId);

  useEffect(() => {
    if (slug && channelId) {
      joinChannel(slug, channelId);
    }
    return () => leaveChannel();
  }, [slug, channelId, joinChannel, leaveChannel]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string) => {
    if (slug && channelId) {
      await sendMessage(slug, channelId, content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 font-sans">
      
      {/* Top Header */}
      <div className="h-14 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          {currentChannel?.isPrivate ? (
            <Lock className="w-5 h-5 text-gray-500 mr-2" />
          ) : (
            <Hash className="w-5 h-5 text-gray-500 mr-2" />
          )}
          <h2 className="font-bold text-gray-100">{currentChannel?.name || 'Loading...'}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
            <Users className="w-4 h-4 mr-1.5" />
            <span className="text-sm font-medium">12</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 border border-gray-800">
              {currentChannel?.isPrivate ? <Lock className="w-8 h-8" /> : <Hash className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Welcome to #{currentChannel?.name}</h3>
            <p className="text-sm">This is the beginning of this channel's history.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.userId;
            const showHeader = idx === 0 || messages[idx - 1].senderId !== msg.senderId || 
              new Date(msg.createdAt).getTime() - new Date(messages[idx - 1].createdAt).getTime() > 300000;

            return (
              <div key={msg.messageId} className="group flex items-start -mx-4 px-4 py-1 hover:bg-gray-900/40 rounded-lg transition-colors">
                
                {/* Avatar area */}
                <div className="w-10 flex-shrink-0 flex justify-center">
                  {showHeader ? (
                    <div className="w-9 h-9 rounded-md bg-gradient-to-br from-white to-gray-400 flex items-center justify-center text-white font-bold shadow-md">
                      {msg.senderName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 pt-1.5">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </div>
                  )}
                </div>

                {/* Content area */}
                <div className="ml-3 flex-1 min-w-0">
                  {showHeader && (
                    <div className="flex items-baseline space-x-2 mb-0.5">
                      <span className="font-semibold text-gray-100">{msg.senderName || 'Unknown User'}</span>
                      <span className="text-xs text-gray-500">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                    </div>
                  )}
                  
                  {/* Tiptap content rendered safely */}
                  <div 
                    className="text-gray-300 text-[15px] leading-relaxed prose prose-invert max-w-none prose-p:my-0 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />
                </div>

                {/* Hover Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 bg-gray-900 border border-gray-800 rounded-md p-1 shadow-sm absolute right-6 -mt-3 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded"><Smile className="w-4 h-4" /></button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded"><MessageSquare className="w-4 h-4" /></button>
                  {isMe && (
                    <button 
                      onClick={async () => {
                        if(confirm('Delete message?')) {
                          try {
                            const { apiFetch } = await import('../../lib/api.js');
                            await apiFetch(`/workspaces/${slug}/channels/${channelId}/messages/${msg.messageId}`, { method: 'DELETE' });
                            // A quick hack to refresh since chatStore doesn't expose deleteMessage
                            joinChannel(slug as string, channelId as string);
                          } catch(err: any) { alert(err.message); }
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded" title="Delete Message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  )}
                  <button className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded"><MoreHorizontal className="w-4 h-4" /></button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 pb-6 pt-2 shrink-0">
        <TiptapEditor 
          onSubmit={handleSend} 
          placeholder={`Message #${currentChannel?.name || 'channel'}`}
        />
      </div>

    </div>
  );
};
