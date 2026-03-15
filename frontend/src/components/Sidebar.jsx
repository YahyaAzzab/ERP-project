import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BarChart, DollarSign, Users, Package } from 'lucide-react';

const Sidebar = () => {
  const { logout, hasRole } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <BarChart size={20} />, roles: ['admin', 'comptable', 'rh', 'magasinier'] },
    { to: '/comptabilite', label: 'Comptabilité', icon: <DollarSign size={20} />, roles: ['admin', 'comptable'] },
    { to: '/rh', label: 'Ressources Humaines', icon: <Users size={20} />, roles: ['admin', 'rh'] },
    { to: '/stocks', label: 'Gestion des Stocks', icon: <Package size={20} />, roles: ['admin', 'magasinier'] },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">ERP PME</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {navLinks.map((link) =>
            hasRole(...link.roles) ? (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center p-4 hover:bg-gray-700 ${isActive ? 'bg-gray-900' : ''}`
                  }
                >
                  {link.icon}
                  <span className="ml-4">{link.label}</span>
                </NavLink>
              </li>
            ) : null
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center p-2 bg-red-600 hover:bg-red-700 rounded"
        >
          <LogOut size={20} />
          <span className="ml-4">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;