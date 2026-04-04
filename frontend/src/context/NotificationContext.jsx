import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService';

const NotificationContext = createContext(null);

const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);

    setTimeout(() => ctx.close(), 220);
  } catch {
    // Ignore audio errors (autoplay restrictions / unsupported contexts)
  }
};

const normalizeNotification = (item) => ({
  _id: item?._id,
  type: item?.type || 'INFO',
  title: item?.title || 'Notification',
  message: item?.message || '',
  module: item?.module || 'GENERAL',
  link: item?.link || '',
  data: item?.data || null,
  lu: Boolean(item?.lu),
  createdAt: item?.createdAt || new Date().toISOString(),
});

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  const loadInitialNotifications = async () => {
    try {
      const response = await getNotifications({ page: 1, limit: 15 });
      const data = response?.data?.data;
      const items = Array.isArray(data?.notifications) ? data.notifications : [];
      const unread = Number(data?.unreadCount || 0);

      setNotifications(items.map(normalizeNotification));
      setUnreadCount(unread);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    loadInitialNotifications();

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socket.on('notifications:new', (payload) => {
      const incoming = normalizeNotification(payload);

      setNotifications((prev) => {
        const deduped = prev.filter((n) => String(n._id) !== String(incoming._id));
        return [incoming, ...deduped].slice(0, 30);
      });

      setUnreadCount((prev) => prev + 1);

      const toastId = `${incoming._id}-${Date.now()}`;
      setToasts((prev) => [{ id: toastId, ...incoming }, ...prev].slice(0, 4));

      playNotificationSound();

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (String(n._id) === String(id) ? { ...n, lu: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // keep optimistic UI stable if API fails
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch {
      // ignore API errors in UI-level action
    }
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      toasts,
      markAsRead,
      markAllAsRead,
      dismissToast,
      reloadNotifications: loadInitialNotifications,
    }),
    [notifications, unreadCount, toasts]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-[320px] rounded-xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.message}</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-xs"
                onClick={() => dismissToast(toast.id)}
              >
                Fermer
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
