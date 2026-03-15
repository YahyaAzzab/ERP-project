import React, { useMemo, useState } from 'react';
import Factures from './Factures';
import Comptes from './Comptes';
import Ecritures from './Ecritures';
import Balance from './Balance';

const tabs = [
  { key: 'factures', label: 'Factures' },
  { key: 'comptes', label: 'Comptes' },
  { key: 'ecritures', label: 'Ecritures' },
  { key: 'balance', label: 'Balance' },
];

const Comptabilite = () => {
  const [activeTab, setActiveTab] = useState('factures');

  const ActiveContent = useMemo(() => {
    if (activeTab === 'comptes') return <Comptes />;
    if (activeTab === 'ecritures') return <Ecritures />;
    if (activeTab === 'balance') return <Balance />;
    return <Factures />;
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Module Comptabilite</h1>
        <p className="text-sm text-gray-500 mt-1">Gestion des factures, comptes, ecritures et balance generale.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section>{ActiveContent}</section>
    </div>
  );
};

export default Comptabilite;
