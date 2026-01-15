'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { fetchNotifications, fetchUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: { name: string; color: string };
  entity_type?: string;
  entity_id?: string;
}

export default function NotificationsPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [notifs, countData] = await Promise.all([
        fetchNotifications(user.id),
        fetchUnreadCount(user.id)
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.count);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    const newSocket = io('http://localhost:3002');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinUser', { userId: user.id });
    });

    newSocket.on('notification.created', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      newSocket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        className="text-slate-500 hover:text-slate-700 relative p-1 rounded-full hover:bg-slate-100 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: notif.actor?.color || '#cbd5e1' }}
                  >
                    {notif.actor?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">
                      <span className="font-semibold">{notif.actor?.name || 'System'}</span> {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-blue-600 hover:text-blue-800 self-start mt-1"
                      title="Mark as read"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
