import api from './api';

export const getNotifications = (params) => api.get('/notifications', { params });
export const getUnreadNotificationCount = () => api.get('/notifications/count');
export const markNotificationAsRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.patch('/notifications/mark-all-read');
