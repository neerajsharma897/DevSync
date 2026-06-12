import React, { useState } from 'react';
import { Bell, Check, MessageSquare, FileEdit, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export const NotificationsInbox = () => {
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'mention', title: 'Alice mentioned you in #general', time: '10m ago', isRead: false },
    { id: '2', type: 'task_assigned', title: 'You were assigned to DEV-42', time: '1h ago', isRead: false },
    { id: '3', type: 'sprint_started', title: 'Sprint 3 has started', time: '2h ago', isRead: true },
    { id: '4', type: 'reply', title: 'Bob replied to your thread in #engineering', time: '1d ago', isRead: true },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
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

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-lg divide-y divide-gray-800/60">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={clsx(
                "flex items-start p-5 hover:bg-gray-800/40 cursor-pointer transition-colors relative group",
                !notif.isRead ? "bg-gray-800/20" : ""
              )}
            >
              {!notif.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full"></div>
              )}
              
              <div className="mt-1 mr-4">
                {notif.type === 'mention' || notif.type === 'reply' ? (
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                ) : notif.type === 'task_assigned' ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <FileEdit className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className={clsx("text-sm mb-1", !notif.isRead ? "text-gray-100 font-bold" : "text-gray-300 font-medium")}>
                  {notif.title}
                </p>
                <span className="text-xs text-gray-500">{notif.time}</span>
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
      </div>
    </div>
  );
};
