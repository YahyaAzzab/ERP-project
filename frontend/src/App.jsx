import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Comptabilite from './pages/Comptabilite';
import Factures from './pages/Comptabilite/Factures';
import Comptes from './pages/Comptabilite/Comptes';
import Balance from './pages/Comptabilite/Balance';
import RH from './pages/RH';
import Employes from './pages/RH/Employes';
import Conges from './pages/RH/Conges';
import FichesPaie from './pages/RH/FichesPaie';
import Stocks from './pages/Stocks';

const AppRoutes = () => {
  const { hasRole } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        {hasRole('admin', 'comptable', 'rh', 'magasinier') && <Route path="dashboard" element={<Dashboard />} />}
        {hasRole('admin', 'comptable') && <Route path="comptabilite" element={<Comptabilite />} />}
        {hasRole('admin', 'comptable') && <Route path="comptabilite/factures" element={<Factures />} />}
        {hasRole('admin', 'comptable') && <Route path="comptabilite/comptes" element={<Comptes />} />}
        {hasRole('admin', 'comptable') && <Route path="comptabilite/balance" element={<Balance />} />}
        {hasRole('admin', 'rh') && <Route path="rh" element={<RH />} />}
        {hasRole('admin', 'rh') && <Route path="rh/employes" element={<Employes />} />}
        {hasRole('admin', 'rh') && <Route path="rh/conges" element={<Conges />} />}
        {hasRole('admin', 'rh') && <Route path="rh/fiches-paie" element={<FichesPaie />} />}
        {hasRole('admin', 'magasinier') && <Route path="stocks" element={<Stocks />} />}
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
