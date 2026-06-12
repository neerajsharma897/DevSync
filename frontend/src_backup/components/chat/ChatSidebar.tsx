import React from 'react';
import { NavLink } from 'react-router-dom';
import { Hash, Lock, Search, Plus, MessageCircle } from 'lucide-react';
import { channels } from '../../data/channels';
import { users } from '../../data/users';

const ChatSidebar: React.FC = () => {
  const publicChannels = channels.filter(c => !c.isPrivate && !c.isDirectMessage);
  const privateChannels = channels.filter(c => c.isPrivate && !c.isDirectMessage);
  const directMessages = channels.filter(c => c.isDirectMessage);

  return (
    <div className="w-80 flex flex-col h-full glass-sidebar">
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold gradient-text">Messages</h2>
          <button className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-all">
            <MessageCircle size={18} />
          </button>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="glass-input pl-9 pr-4 py-2 text-xs w-full focus:glass-input-focus"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        {/* Public Channels */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Channels</span>
            <button className="text-text-muted hover:text-white"><Plus size={14} /></button>
          </div>
          <div className="space-y-0.5">
            {publicChannels.map(channel => (
              <NavLink 
                key={channel.id}
                to={`/chat/${channel.id}`}
                className={({ isActive }) => 
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive ? 'bg-white/10 text-white font-medium border border-white/10' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`
                }
              >
                <Hash size={14} />
                <span>{channel.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Private Channels */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Private</span>
          </div>
          <div className="space-y-0.5">
            {privateChannels.map(channel => (
              <NavLink 
                key={channel.id}
                to={`/chat/${channel.id}`}
                className={({ isActive }) => 
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive ? 'bg-white/10 text-white font-medium border border-white/10' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`
                }
              >
                <Hash size={14} />
                <span>{channel.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Direct Messages</span>
          </div>
          <div className="space-y-0.5">
            {directMessages.map(dm => {
              const user = users.find(u => u.fullName === dm.name);
              return (
                <NavLink 
                  key={dm.id}
                  to={`/chat/${dm.id}`}
                  className={({ isActive }) => 
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive ? 'bg-white/10 text-white font-medium border border-white/10' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    }`
                  }
                >
                  <div className="relative">
                    <img src={user?.avatar} alt={dm.name} className="w-5 h-5 rounded-full" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-bg-primary ${user?.status === 'online' ? 'bg-success' : 'bg-text-muted'}`} />
                  </div>
                  <span>{dm.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
