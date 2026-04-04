import api from './api';

export const getUsers = (params) => api.get('/auth/users', { params });
export const createUser = (payload) => api.post('/auth/users', payload);
export const updateUser = (id, payload) => api.put(`/auth/users/${id}`, payload);
export const resetUserPassword = (id, nouveauPassword) => api.put(`/auth/users/${id}/password`, { nouveauPassword });
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);
