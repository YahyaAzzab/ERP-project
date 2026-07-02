import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    const userData = localStorage.getItem('erp_user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setToken(token);
        setUser(parsedUser);
      } catch (err) {
        console.warn('[AuthProvider] erp_user localStorage invalid:', err);
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setToken(data.token);
    navigate('/dashboard');
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const hasRole = (...roles) => {
    const currentRole = String(user?.role || '').toLowerCase();
    return roles.map((role) => String(role).toLowerCase()).includes(currentRole);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
