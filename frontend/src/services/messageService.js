import api from './api';

export const getDestinataires = (params) => api.get('/messages/destinataires', { params });
export const getReception = (params) => api.get('/messages/reception', { params });
export const getEnvoyes = (params) => api.get('/messages/envoyes', { params });
export const getMessageById = (id) => api.get(`/messages/${id}`);
export const envoyerMessage = (payload) => api.post('/messages', payload);
export const marquerCommeLu = (id) => api.patch(`/messages/${id}/lu`);
