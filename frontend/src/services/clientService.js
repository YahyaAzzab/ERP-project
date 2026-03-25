import api from './api';

export const getClients = (params) => api.get('/clients', { params });
export const getClientById = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);
export const getStatistiquesClients = () => api.get('/clients/statistiques');
export const getClientsActifs = () => api.get('/clients', { params: { statut: 'ACTIF', limit: 100 } });
