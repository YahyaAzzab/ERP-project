import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BarChart, DollarSign, Users, Package, ChevronDown, ChevronRight, UserRound, Settings, MessageSquare } from 'lucide-react';

const Sidebar = () => {
  const { logout, hasRole } = useAuth();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const [isHovered, setIsHovered] = useState(false);

  const canSeeCompta = hasRole('admin', 'comptable');
  const canSeeRH = hasRole('admin', 'rh');
  const canSeeStocks = hasRole('admin', 'magasinier');

  const [openMenus, setOpenMenus] = useState({
    comptabilite: false,
    rh: false,
    stocks: false,
    parametres: false,
  });

  const autoOpenedMenus = useMemo(() => ({
    comptabilite: location.pathname.startsWith('/comptabilite'),
    rh: location.pathname.startsWith('/rh'),
    stocks: location.pathname.startsWith('/stocks'),
    parametres: location.pathname.startsWith('/parametres'),
  }), [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isExpanded = !isDesktop || isHovered;

  const isMenuOpen = (key) => openMenus[key] || autoOpenedMenus[key];

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !isMenuOpen(key) }));
  };

  const baseLinkClass = ({ isActive }) =>
    `flex items-center p-4 hover:bg-gray-700 transition-all ${isActive ? 'bg-gray-900' : ''} ${isExpanded ? '' : 'justify-center'}`;

  const childLinkClass = ({ isActive }) =>
    `block py-2 px-4 rounded text-sm hover:bg-gray-700 ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300'}`;

  const handleNav = () => {};

  return (
    <aside
      onMouseEnter={() => isDesktop && setIsHovered(true)}
      onMouseLeave={() => isDesktop && setIsHovered(false)}
      className={`h-full bg-gray-800 text-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      <div className="p-4 border-b border-gray-700">
        <h1 className={`font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'text-2xl opacity-100' : 'text-lg opacity-100 text-center'}`}>
          {isExpanded ? 'ERP DOYA' : 'ERP'}
        </h1>
      </div>
      <nav className="flex-grow overflow-y-auto">
        <ul>
          {hasRole('admin', 'comptable', 'rh', 'magasinier') && (
            <li>
              <NavLink to="/dashboard" className={baseLinkClass} onClick={handleNav}>
                <BarChart size={20} />
                {isExpanded && <span className="ml-4">Dashboard</span>}
              </NavLink>
            </li>
          )}

          {canSeeCompta && (
            <li>
              <button
                type="button"
                onClick={() => toggleMenu('comptabilite')}
                className={`w-full flex items-center p-4 hover:bg-gray-700 ${isExpanded ? 'justify-between' : 'justify-center'}`}
              >
                <span className="flex items-center">
                  <DollarSign size={20} />
                  {isExpanded && <span className="ml-4">Comptabilite</span>}
                </span>
                {isExpanded && (isMenuOpen('comptabilite') ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </button>

              {isExpanded && isMenuOpen('comptabilite') && (
                <div className="pl-10 pr-3 pb-3 space-y-1 transition-all duration-200">
                  <NavLink to="/comptabilite/factures" className={childLinkClass} onClick={handleNav}>Factures</NavLink>
                  <NavLink to="/comptabilite/comptes" className={childLinkClass} onClick={handleNav}>Comptes</NavLink>
                  <NavLink to="/comptabilite/ecritures" className={childLinkClass} onClick={handleNav}>Ecritures</NavLink>
                  <NavLink to="/comptabilite/balance" className={childLinkClass} onClick={handleNav}>Balance</NavLink>
                </div>
              )}
            </li>
          )}

          {canSeeRH && (
            <li>
              <button
                type="button"
                onClick={() => toggleMenu('rh')}
                className={`w-full flex items-center p-4 hover:bg-gray-700 ${isExpanded ? 'justify-between' : 'justify-center'}`}
              >
                <span className="flex items-center">
                  <Users size={20} />
                  {isExpanded && <span className="ml-4">Ressources Humaines</span>}
                </span>
                {isExpanded && (isMenuOpen('rh') ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </button>

              {isExpanded && isMenuOpen('rh') && (
                <div className="pl-10 pr-3 pb-3 space-y-1 transition-all duration-200">
                  <NavLink to="/rh/employes" className={childLinkClass} onClick={handleNav}>Employes</NavLink>
                  <NavLink to="/rh/conges" className={childLinkClass} onClick={handleNav}>Conges</NavLink>
                  <NavLink to="/rh/fiches-paie" className={childLinkClass} onClick={handleNav}>Fiches de paie</NavLink>
                </div>
              )}
            </li>
          )}

          {canSeeStocks && (
            <li>
              <button
                type="button"
                onClick={() => toggleMenu('stocks')}
                className={`w-full flex items-center p-4 hover:bg-gray-700 ${isExpanded ? 'justify-between' : 'justify-center'}`}
              >
                <span className="flex items-center">
                  <Package size={20} />
                  {isExpanded && <span className="ml-4">Gestion des Stocks</span>}
                </span>
                {isExpanded && (isMenuOpen('stocks') ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </button>

              {isExpanded && isMenuOpen('stocks') && (
                <div className="pl-10 pr-3 pb-3 space-y-1 transition-all duration-200">
                  <NavLink to="/stocks/produits" className={childLinkClass} onClick={handleNav}>Produits</NavLink>
                  <NavLink to="/stocks/mouvements" className={childLinkClass} onClick={handleNav}>Mouvements</NavLink>
                  <NavLink to="/stocks/fournisseurs" className={childLinkClass} onClick={handleNav}>Fournisseurs</NavLink>
                  <NavLink to="/stocks/inventaire" className={childLinkClass} onClick={handleNav}>Inventaire</NavLink>
                </div>
              )}
            </li>
          )}

          {hasRole('admin', 'comptable') && (
            <li>
              <NavLink to="/clients" className={baseLinkClass} onClick={handleNav}>
                <UserRound size={20} />
                {isExpanded && <span className="ml-4">Clients</span>}
              </NavLink>
            </li>
          )}

          {hasRole('admin', 'comptable', 'rh', 'magasinier') && (
            <li>
              <NavLink to="/messages" className={baseLinkClass} onClick={handleNav}>
                <MessageSquare size={20} />
                {isExpanded && <span className="ml-4">Messages</span>}
              </NavLink>
            </li>
          )}

          {hasRole('admin') && (
            <li>
              <button
                type="button"
                onClick={() => toggleMenu('parametres')}
                className={`w-full flex items-center p-4 hover:bg-gray-700 ${isExpanded ? 'justify-between' : 'justify-center'}`}
              >
                <span className="flex items-center">
                  <Settings size={20} />
                  {isExpanded && <span className="ml-4">Parametres</span>}
                </span>
                {isExpanded && (isMenuOpen('parametres') ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </button>

              {isExpanded && isMenuOpen('parametres') && (
                <div className="pl-10 pr-3 pb-3 space-y-1 transition-all duration-200">
                  <NavLink to="/parametres/utilisateurs" className={childLinkClass} onClick={handleNav}>Gestion utilisateurs</NavLink>
                  <NavLink to="/parametres/logs" className={childLinkClass} onClick={handleNav}>Journal d'activite</NavLink>
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className={`w-full flex items-center p-2 bg-red-600 hover:bg-red-700 rounded ${isExpanded ? '' : 'justify-center'}`}
        >
          <LogOut size={20} />
          {isExpanded && <span className="ml-4">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;