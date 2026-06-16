import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, MessageSquare, FileEdit, CheckCircle2, GitBranch, IterationCcw, Filter } from 'lucide-react';
import clsx from 'clsx';
import { apiFetch } from '../lib/api.js';

export const NotificationsInbox = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'unread'>('all');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id: string) => {
    const notif = notifications.find(n => n.notificationId === id);
    if (notif?.isRead) return;

    try {
      setNotifications(notifications.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'mention':
        return { icon: MessageSquare, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'task':
        return { icon: FileEdit, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
      case 'sprint':
        return { icon: IterationCcw, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'ci':
        return { icon: GitBranch, color: 'text-green-400 bg-green-500/10 border-green-500/20' };
      default:
        return { icon: CheckCircle2, color: 'text-gray-400 bg-white/10 border-white/20' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Apply filters
  let filtered = notifications;
  if (viewMode === 'unread') filtered = filtered.filter(n => !n.isRead);
  if (filterType !== 'all') filtered = filtered.filter(n => n.type === filterType);

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">Inbox</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button 
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="flex items-center text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </button>
        </div>

        {/* All / Unread Toggle + Type Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <button
              onClick={() => setViewMode('all')}
              className={clsx("px-4 py-2 text-sm font-medium transition-colors", viewMode === 'all' ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200")}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('unread')}
              className={clsx("px-4 py-2 text-sm font-medium transition-colors", viewMode === 'unread' ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200")}
            >
              Unread
            </button>
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="task">Tasks</option>
            <option value="message">Messages</option>
            <option value="mention">Mentions</option>
            <option value="sprint">Sprints</option>
            <option value="ci">CI/CD</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-lg divide-y divide-gray-800/60">
            {filtered.map(notif => {
              const { icon: Icon, color } = getIcon(notif.type);
              return (
                <div 
                  key={notif.notificationId}
                  onClick={() => {
                    markRead(notif.notificationId);
                    // Navigate to entity if link data exists
                    if (notif.link) navigate(notif.link);
                  }}
                  className={clsx(
                    "flex items-start p-5 hover:bg-gray-800/40 cursor-pointer transition-colors relative group",
                    !notif.isRead ? "bg-gray-800/20" : ""
                  )}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full"></div>
                  )}
                  
                  <div className="mt-1 mr-4">
                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center border", color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className={clsx("text-sm mb-1", !notif.isRead ? "text-gray-100 font-bold" : "text-gray-300 font-medium")}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-gray-500">{notif.body}</span>
                  </div>

                  {!notif.isRead && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markRead(notif.notificationId); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-all"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{viewMode === 'unread' ? 'No unread notifications.' : "You're all caught up!"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
