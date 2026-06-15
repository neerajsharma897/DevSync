import React, { useState, useEffect } from 'react';
import { Bell, Check, MessageSquare, FileEdit, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { apiFetch } from '../lib/api.js';

export const NotificationsInbox = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
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

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-lg divide-y divide-gray-800/60">
            {notifications.map(notif => (
              <div 
                key={notif.notificationId}
                onClick={() => markRead(notif.notificationId)}
                className={clsx(
                  "flex items-start p-5 hover:bg-gray-800/40 cursor-pointer transition-colors relative group",
                  !notif.isRead ? "bg-gray-800/20" : ""
                )}
              >
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full"></div>
                )}
                
                <div className="mt-1 mr-4">
                  {notif.type === 'message' || notif.type === 'mention' ? (
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  ) : notif.type === 'task' ? (
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20">
                      <FileEdit className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className={clsx("text-sm mb-1", !notif.isRead ? "text-gray-100 font-bold" : "text-gray-300 font-medium")}>
                    {notif.title}
                  </p>
                  <span className="text-xs text-gray-500">{notif.body}</span>
                </div>
              </div>
            ))}
            
            {notifications.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You're all caught up!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
