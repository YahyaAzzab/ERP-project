import React from 'react';

const Badge = ({ status }) => {
  const statusString = String(status).toUpperCase();

  const colorClasses = {
    // Green
    'ACTIF': 'bg-green-100 text-green-800',
    'PAYEE': 'bg-green-100 text-green-800',
    'PAYE': 'bg-green-100 text-green-800',
    'APPROUVE': 'bg-green-100 text-green-800',
    // Red
    'INACTIF': 'bg-red-100 text-red-800',
    'ANNULEE': 'bg-red-100 text-red-800',
    'ANNULE': 'bg-red-100 text-red-800',
    'REFUSE': 'bg-red-100 text-red-800',
    // Yellow
    'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
    'BROUILLON': 'bg-yellow-100 text-yellow-800',
    // Blue
    'VALIDEE': 'bg-blue-100 text-blue-800',
    'CDI': 'bg-blue-100 text-blue-800',
    'ACTIF_COMPTE': 'bg-blue-100 text-blue-800',
    'PASSIF': 'bg-violet-100 text-violet-800',
    'CHARGE': 'bg-emerald-100 text-emerald-800',
    'PRODUIT': 'bg-cyan-100 text-cyan-800',
    // Orange
    'SUSPENDU': 'bg-orange-100 text-orange-800',
    'CDD': 'bg-orange-100 text-orange-800',
    // Default
    'default': 'bg-gray-100 text-gray-800',
  };

  const color = colorClasses[statusString] || colorClasses['default'];

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
};

export default Badge;