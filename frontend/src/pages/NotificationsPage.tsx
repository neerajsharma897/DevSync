import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock
} from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const notifications: any[] = [];

  const filtered = activeTab === 'all' ? notifications : notifications.filter(n => n.unread);

  return (
    <div className="flex flex-col h-full overflow-hidden p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Bell size={24} className="text-accent-purple" />
            Notifications
          </h1>
          <p className="text-text-secondary text-sm mt-1">Stay on top of everything happening in your workspaces</p>
        </div>
        <button className="text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 border border-border-default rounded-lg hover:bg-bg-hover transition-colors flex items-center gap-2">
          <CheckCircle2 size={16} /> Mark all as read
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6 border-b border-border-default/50">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'all' ? 'border-accent-purple text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          All
        </button>
        <button 
          onClick={() => setActiveTab('unread')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'unread' ? 'border-accent-purple text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Unread
          {notifications.filter(n => n.unread).length > 0 && (
            <span className="bg-accent-purple/20 text-accent-purple px-1.5 py-0.5 rounded text-[10px]">
              {notifications.filter(n => n.unread).length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center">
            <Bell size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-bold">You're all caught up!</h3>
            <p className="text-sm text-text-secondary">No {activeTab === 'unread' ? 'unread' : ''} notifications at the moment.</p>
          </div>
        ) : (
          filtered.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-xl border flex items-start gap-4 transition-all hover:bg-bg-hover cursor-pointer ${
                notification.unread ? 'bg-bg-tertiary border-accent-purple/30' : 'glass-card border-border-default'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                notification.unread ? 'bg-bg-primary' : 'bg-bg-tertiary'
              }`}>
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-medium ${notification.unread ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>
                    {notification.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase font-bold tracking-widest">
                    <Clock size={10} />
                    {notification.time}
                  </div>
                </div>
                <p className={`text-sm ${notification.unread ? 'text-text-secondary' : 'text-text-muted'}`}>
                  {notification.message}
                </p>
              </div>
              {notification.unread && (
                <div className="w-2 h-2 rounded-full bg-accent-purple mt-4 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
