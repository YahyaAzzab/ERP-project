import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BarChart, DollarSign, Users, Package, ChevronDown, ChevronRight, UserRound, Settings, MessageSquare, X } from 'lucide-react';

const Sidebar = ({ isMobileOpen = false, onCloseMobile = () => {} }) => {
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

  const handleNav = () => {
    if (!isDesktop) {
      onCloseMobile();
    }
  };

  const baseLinkClass = ({ isActive }) =>
    `flex items-center p-4 hover:bg-gray-700 transition-all ${isActive ? 'bg-gray-900' : ''} ${isExpanded ? '' : 'justify-center'}`;

  const childLinkClass = ({ isActive }) =>
    `block py-2 px-4 rounded text-sm hover:bg-gray-700 ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300'}`;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 lg:hidden ${isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onCloseMobile}
      />
      <aside
        onMouseEnter={() => isDesktop && setIsHovered(true)}
        onMouseLeave={() => isDesktop && setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-gray-700 bg-gray-800 text-white transition-all duration-300 ease-in-out w-72 max-w-[85vw] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:h-full lg:translate-x-0 ${isDesktop ? (isExpanded ? 'lg:w-64' : 'lg:w-20') : 'lg:w-72'}`}
      >
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h1 className={`overflow-hidden whitespace-nowrap font-bold transition-all duration-300 ${isExpanded ? 'text-2xl opacity-100' : 'text-lg text-center opacity-100'}`}>
            {isExpanded ? 'ERP DOYA' : 'ERP'}
          </h1>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 hover:bg-gray-700 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
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
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={() => {
              logout();
              handleNav();
            }}
            className={`flex w-full items-center rounded bg-red-600 p-2 hover:bg-red-700 ${isExpanded ? '' : 'justify-center'}`}
          >
            <LogOut size={20} />
            {isExpanded && <span className="ml-4">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;