import api from './api';

// =================================
// EMPLOYES
// =================================

export const getEmployes = (params) => {
  return api.get('/rh/employes', { params });
};

export const getEmployeById = (id) => {
  return api.get(`/rh/employes/${id}`);
};

export const createEmploye = (data) => {
  return api.post('/rh/employes', data);
};

export const updateEmploye = (id, data) => {
  return api.put(`/rh/employes/${id}`, data);
};

export const deleteEmploye = (id) => {
  return api.delete(`/rh/employes/${id}`);
};

export const getStatistiquesRH = () => {
  return api.get('/rh/employes/statistiques');
};

// =================================
// CONGES
// =================================

export const getConges = (params) => {
  return api.get('/rh/conges', { params });
};

export const createConge = (data) => {
  return api.post('/rh/conges', data);
};

export const traiterConge = (id, data) => {
  return api.put(`/rh/conges/${id}/traiter`, data);
};

export const annulerConge = (id) => {
  return api.put(`/rh/conges/${id}/annuler`);
};

// =================================
// FICHES DE PAIE
// =================================

export const getFichesPaie = (params) => {
  return api.get('/rh/fiches-paie', { params });
};

export const genererFichePaie = (data) => {
  return api.post('/rh/fiches-paie', data);
};

export const deleteFichePaie = (id) => {
  return api.delete(`/rh/fiches-paie/${id}`);
};
