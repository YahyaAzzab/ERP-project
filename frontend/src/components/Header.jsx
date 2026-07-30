import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Bell, Menu } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Header = ({ onOpenSidebar }) => {
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
    <header className="border-b border-gray-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 lg:hidden"
            title="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Tableau de bord</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenNotifications((prev) => !prev)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {openNotifications && (
              <div className="absolute right-0 z-50 mt-2 w-[min(360px,90vw)] rounded-xl border border-gray-200 bg-white shadow-xl">
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
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm hover:bg-gray-100 sm:gap-2"
            title={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hidden sm:inline">{isDark ? 'Mode clair' : 'Mode sombre'}</span>
          </button>
          <div className="min-w-0 text-right leading-tight">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</p>
            <p className="hidden text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300 sm:block">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;