import React from 'react';
import { useParams } from 'react-router-dom';
import ChatSidebar from '../components/chat/ChatSidebar';
import { users } from '../data/users';
import { channels } from '../data/channels';
import { messages as mockMessages } from '../data/messages';
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
  const activeChannel = channels.find(c => c.id === id) || channels[0];
  const channelMessages = mockMessages.filter(m => m.channelId === activeChannel.id);

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
                 <h2 className="text-sm font-bold leading-none">{activeChannel.name}</h2>
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
           {channelMessages.map(msg => {
              const sender = users.find(u => u.id === msg.senderId);
              return (
                <div key={msg.id} className="flex gap-4 group/msg">
                   <img src={sender?.avatar} alt={sender?.fullName} className="w-10 h-10 rounded-full shrink-0" />
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-bold hover:underline cursor-pointer">{sender?.fullName}</span>
                         <span className="text-[10px] text-text-muted">10:05 AM</span>
                      </div>
                      <p className="text-sm text-text-primary leading-relaxed break-words">{msg.body}</p>
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
                 <button className="shrink-0 text-text-muted hover:text-accent-purple transition-colors">
                    <Plus size={20} />
                 </button>
                 <input 
                   type="text" 
                   placeholder={`Message #${activeChannel.name}`}
                   className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-muted"
                 />
                 <div className="flex items-center gap-2 px-2">
                    <button className="text-text-muted hover:text-accent-purple"><Smile size={20} /></button>
                    <button className="text-accent-purple p-2 hover:bg-accent-purple/10 rounded-xl transition-all">
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
