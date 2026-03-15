import api from './api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });

  // Vérification robuste de la structure de la réponse
  if (response.data && response.data.success && response.data.data) {
    const { user, token } = response.data.data;

    if (token && user) {
      localStorage.setItem('erp_token', token);
      localStorage.setItem('erp_user', JSON.stringify(user));
      return { user, token };
    }
  }

  // Si la structure est incorrecte ou si le token/user est manquant
  throw new Error("La réponse du serveur est invalide ou incomplète.");
};

const logout = () => {
  localStorage.removeItem('erp_token');
  localStorage.removeItem('erp_user');
};

const getCurrentUser = () => {
  const user = localStorage.getItem('erp_user');
  return user ? JSON.parse(user) : null;
};

const getToken = () => {
  return localStorage.getItem('erp_token');
};

const isAuthenticated = () => {
  return !!localStorage.getItem('erp_token');
};

export const authService = {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
};
