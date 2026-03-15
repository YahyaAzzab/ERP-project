import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold">Tableau de bord</h2>
      </div>
      <div>
        <span>Bonjour, {user?.nom} ({user?.role})</span>
      </div>
    </header>
  );
};

export default Header;