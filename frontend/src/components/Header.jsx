import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Header = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [openNotifications, setOpenNotifications] = useState(false);
  const displayName = user?.nom || [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Compte';
  const topNotifications = useMemo(() => notifications.slice(0, 6), [notifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.lu) {
      await markAsRead(notification._id);
    }
    setOpenNotifications(false);
    if (notification?.link) {
      navigate(notification.link);
    }
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Tableau de bord</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenNotifications((prev) => !prev)}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Tout marquer lu
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {topNotifications.length === 0 ? (
                  <p className="text-sm text-gray-500 p-3">Aucune notification</p>
                ) : (
                  topNotifications.map((n) => (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 ${n.lu ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
          title={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {isDark ? 'Mode clair' : 'Mode sombre'}
        </button>
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</p>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">{user?.role}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;