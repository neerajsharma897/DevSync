import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/chat/ChatSidebar';
import { useChatStore } from '../store/useChatStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { users } from '../data/users'; // Temporary fallback for user metadata
import { apiFetch } from '../lib/api';
import { 
  Send, 
  Plus,
  Smile, 
  Info, 
  Search, 
  MoreVertical,
  Hash
} from 'lucide-react';

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { channels, activeChannel, messages, fetchChannels, setActiveChannel, sendMessage, uploadFile } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentWorkspace) {
      fetchChannels();
    }
  }, [currentWorkspace, fetchChannels]);

  useEffect(() => {
    if (id && channels.length > 0) {
      setActiveChannel(id);
    } else if (!id && activeChannel) {
      navigate(`/chat/${activeChannel.id}`, { replace: true });
    }
  }, [id, channels, activeChannel, setActiveChannel, navigate]);

  const handleSend = () => {
    if (inputText.trim() && activeChannel) {
      sendMessage(activeChannel.id, inputText.trim());
      setInputText('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await uploadFile(file);
    setIsUploading(false);

    if (result) {
      const newText = inputText 
        ? `${inputText} [${result.filename}](file:${result.fileId})` 
        : `[${result.filename}](file:${result.fileId})`;
      setInputText(newText);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageBody = (body: string) => {
    if (!body) return '';
    const fileRegex = /\[(.*?)\]\(file:([a-zA-Z0-9-]+)\)/g;
    
    if (!fileRegex.test(body)) {
      return body;
    }

    const parts = [];
    let lastIndex = 0;
    fileRegex.lastIndex = 0;

    let match;
    while ((match = fileRegex.exec(body)) !== null) {
      if (match.index > lastIndex) {
        parts.push(body.substring(lastIndex, match.index));
      }
      
      const filename = match[1];
      const fileId = match[2];
      
      parts.push(
        <a 
          key={match.index}
          href="#"
          className="inline-flex items-center gap-1.5 px-2 py-1 mx-1 bg-bg-hover rounded-md border border-border-default text-accent-purple hover:bg-bg-elevated transition-colors"
          onClick={async (e) => {
             e.preventDefault();
             try {
                const res = await apiFetch(`/workspaces/${currentWorkspace?.slug}/files/${fileId}/download`);
                if (res.downloadUrl) {
                   window.open(res.downloadUrl, '_blank');
                }
             } catch (err) {
                console.error("Failed to get download URL", err);
             }
          }}
        >
          <span className="text-[10px]">📎</span>
          <span className="font-medium text-xs">{filename}</span>
        </a>
      );
      
      lastIndex = fileRegex.lastIndex;
    }
    
    if (lastIndex < body.length) {
      parts.push(body.substring(lastIndex));
    }
    
    return <>{parts}</>;
  };

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 bg-bg-secondary/10">
        {/* Chat Header */}
        <header className="h-16 border-b border-border-default/50 flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center text-accent-purple">
                 <Hash size={18} />
              </div>
              <div>
                 <h2 className="text-sm font-bold leading-none">{activeChannel?.name || 'Loading...'}</h2>
                 <p className="text-[10px] text-text-muted mt-1">General discussion channel for the team</p>
              </div>
           </div>

           <div className="flex items-center gap-4 text-text-muted">
              <button className="hover:text-text-primary px-1"><Search size={18} /></button>
              <button className="hover:text-text-primary px-1"><Info size={18} /></button>
              <button className="hover:text-text-primary px-1"><MoreVertical size={18} /></button>
           </div>
        </header>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
           {messages.map(msg => {
              const sender = users.find(u => u.id === msg.senderId) || { fullName: 'User', avatar: 'https://ui-avatars.com/api/?name=U' };
              return (
                <div key={msg.id} className="flex gap-4 group/msg">
                   <img src={sender?.avatar} alt={sender?.fullName} className="w-10 h-10 rounded-full shrink-0" />
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-bold hover:underline cursor-pointer">{sender?.fullName}</span>
                         <span className="text-[10px] text-text-muted">
                           {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      <p className="text-sm text-text-primary leading-relaxed break-words whitespace-pre-wrap">
                        {renderMessageBody(msg.body)}
                      </p>
                   </div>
                </div>
              );
           })}
        </div>

        {/* Message Input Area */}
        <div className="p-6 pt-0">
           <div className="glass-card bg-bg-tertiary/60 border-border-default p-1 focus-within:border-accent-purple/50 transition-all">
              <div className="flex items-center gap-2 px-2 py-1 border-b border-border-default/30 mb-1">
                 <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-all"><b>B</b></button>
                 <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-all"><i>I</i></button>
                 <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-all"><u>U</u></button>
              </div>
              <div className="flex items-center gap-3 p-3">
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isUploading || !activeChannel}
                   className="shrink-0 text-text-muted hover:text-accent-purple transition-colors disabled:opacity-50"
                 >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={20} />
                    )}
                 </button>
                 <input 
                   type="file" 
                   className="hidden" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                 />
                 <input 
                   type="text" 
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyDown={handleKeyDown}
                   placeholder={activeChannel ? `Message #${activeChannel.name}` : 'Select a channel'}
                   className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-muted"
                   disabled={!activeChannel}
                 />
                 <div className="flex items-center gap-2 px-2">
                    <button className="text-text-muted hover:text-accent-purple"><Smile size={20} /></button>
                    <button 
                       onClick={handleSend}
                       disabled={!activeChannel || !inputText.trim()}
                       className="text-accent-purple p-2 hover:bg-accent-purple/10 rounded-xl transition-all disabled:opacity-50"
                    >
                       <Send size={20} />
                    </button>
                 </div>
              </div>
           </div>
           <p className="text-[10px] text-text-muted mt-2 px-2">
              <b>Return</b> to send, <b>Shift + Return</b> for new line
           </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
