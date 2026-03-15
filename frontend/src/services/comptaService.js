import api from './api';

// =================================
// COMPTES COMPTABLES
// =================================

export const getComptes = (params) => {
  return api.get('/comptabilite/comptes', { params });
};

export const createCompte = (data) => {
  return api.post('/comptabilite/comptes', data);
};

export const updateCompte = (id, data) => {
  return api.put(`/comptabilite/comptes/${id}`, data);
};

export const deleteCompte = (id) => {
  return api.delete(`/comptabilite/comptes/${id}`);
};

// =================================
// ECRITURES COMPTABLES
// =================================

export const getEcritures = (params) => {
  return api.get('/comptabilite/ecritures', { params });
};

export const createEcriture = (data) => {
  return api.post('/comptabilite/ecritures', data);
};

// =================================
// FACTURES
// =================================

export const getFactures = (params) => {
  return api.get('/comptabilite/factures', { params });
};

export const getFactureById = (id) => {
  return api.get(`/comptabilite/factures/${id}`);
};

export const createFacture = (data) => {
  return api.post('/comptabilite/factures', data);
};

export const updateFacture = (id, data) => {
  return api.put(`/comptabilite/factures/${id}`, data);
};

export const updateStatutFacture = (id, statut) => {
  return api.patch(`/comptabilite/factures/${id}/statut`, { statut });
};

export const deleteFacture = (id) => {
  return api.delete(`/comptabilite/factures/${id}`);
};

// =================================
// RAPPORTS
// =================================

export const getBalance = () => {
  return api.get('/comptabilite/balance');
};

export const getGrandLivre = (compteId) => {
  return api.get(`/comptabilite/grand-livre/${compteId}`);
};
