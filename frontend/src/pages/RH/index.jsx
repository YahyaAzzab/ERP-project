import React, { useMemo, useState } from 'react';
import Employes from './Employes';
import Conges from './Conges';
import FichesPaie from './FichesPaie';

const tabs = [
  { key: 'employes', label: 'Employes' },
  { key: 'conges', label: 'Conges' },
  { key: 'fiches', label: 'Fiches de Paie' },
];

const RH = () => {
  const [activeTab, setActiveTab] = useState('employes');

  const ActiveContent = useMemo(() => {
    if (activeTab === 'conges') return <Conges />;
    if (activeTab === 'fiches') return <FichesPaie />;
    return <Employes />;
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Module Ressources Humaines</h1>
        <p className="text-sm text-gray-500 mt-1">Gestion des employes, conges et fiches de paie.</p>
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

export default RH;
