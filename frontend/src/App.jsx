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
import Ecritures from './pages/Comptabilite/Ecritures';
import RH from './pages/RH';
import Employes from './pages/RH/Employes';
import Conges from './pages/RH/Conges';
import FichesPaie from './pages/RH/FichesPaie';
import Stocks from './pages/Stocks';
import Produits from './pages/Stocks/Produits';
import Mouvements from './pages/Stocks/Mouvements';
import Fournisseurs from './pages/Stocks/Fournisseurs';
import Inventaire from './pages/Stocks/Inventaire';
import Clients from './pages/Clients';
import Parametres from './pages/Parametres';
import Messages from './pages/Messages';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

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
        {hasRole('admin', 'comptable') && <Route path="comptabilite/factures/:factureId" element={<Factures />} />}
        {hasRole('admin', 'comptable') && <Route path="comptabilite/comptes" element={<Comptes />} />}
        {hasRole('admin', 'comptable') && <Route path="comptabilite/ecritures" element={<Ecritures />} />}
        {hasRole('admin', 'comptable') && <Route path="comptabilite/balance" element={<Balance />} />}
        {hasRole('admin', 'rh') && <Route path="rh" element={<RH />} />}
        {hasRole('admin', 'rh') && <Route path="rh/employes" element={<Employes />} />}
        {hasRole('admin', 'rh') && <Route path="rh/conges" element={<Conges />} />}
        {hasRole('admin', 'rh') && <Route path="rh/fiches-paie" element={<FichesPaie />} />}
        {hasRole('admin', 'magasinier') && <Route path="stocks" element={<Stocks />} />}
        {hasRole('admin', 'magasinier') && <Route path="stocks/produits" element={<Produits />} />}
        {hasRole('admin', 'magasinier') && <Route path="stocks/mouvements" element={<Mouvements />} />}
        {hasRole('admin', 'magasinier') && <Route path="stocks/fournisseurs" element={<Fournisseurs />} />}
        {hasRole('admin', 'magasinier') && <Route path="stocks/inventaire" element={<Inventaire />} />}
        {hasRole('admin', 'comptable') && <Route path="clients" element={<Clients />} />}
        {hasRole('admin', 'comptable') && <Route path="clients/:clientId" element={<Clients />} />}
        {hasRole('admin', 'comptable', 'rh', 'magasinier') && <Route path="messages" element={<Messages />} />}
        {hasRole('admin') && <Route path="parametres" element={<Parametres />} />}
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
