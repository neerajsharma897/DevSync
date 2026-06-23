import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import NotificationDropdown from './NotificationDropdown';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  return (
    <header className="glass-topbar h-16 flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group max-w-md w-full" onClick={() => navigate('/search')}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks, messages..." 
            className="glass-input w-full pl-10 pr-12 py-2 text-sm focus:glass-input-focus cursor-text"
            readOnly
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-border-default bg-bg-tertiary text-[10px] text-text-muted font-mono">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div 
          onClick={() => navigate('/workspaces')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-tertiary/50 border border-border-default cursor-pointer hover:border-white/30 transition-all"
        >
          <div className="w-5 h-5 rounded overflow-hidden">
             <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                <span className="text-[10px] font-bold">{currentWorkspace?.name.substring(0, 2).toUpperCase() || 'DS'}</span>
             </div>
          </div>
          <span className="text-xs font-semibold">{currentWorkspace?.name || 'DevSync Labs'}</span>
          <ChevronDown size={14} className="text-text-muted" />
        </div>

        <NotificationDropdown />

        <div className="w-px h-6 bg-border-default"></div>

        <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none">{user?.fullName || 'User'}</p>
              <p className="text-[10px] text-text-muted mt-1">@{user?.email.split('@')[0] || 'username'}</p>
           </div>
           <div className="w-8 h-8 rounded-full border border-white/30 p-0.5">
             <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
             </div>
           </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
