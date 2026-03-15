import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { getBalance } from '../../services/comptaService';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
};

const Balance = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rows, setRows] = useState([]);
  const [totaux, setTotaux] = useState({ totalDebit: 0, totalCredit: 0, solde: 0 });

  const fetchBalance = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await getBalance();
      const data = response?.data?.data || {};
      setRows(Array.isArray(data.comptes) ? data.comptes : []);
      setTotaux(data.totauxGeneraux || { totalDebit: 0, totalCredit: 0, solde: 0 });
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Impossible de charger la balance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const hasData = useMemo(() => rows.length > 0, [rows]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Balance generale</h2>
          <p className="text-sm text-gray-500">Vue consolidee des soldes debit/credit par compte.</p>
        </div>
        <button onClick={fetchBalance} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2">
          <RefreshCcw size={16} /> Actualiser
        </button>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Numero</th>
              <th className="px-4 py-3 text-left">Libelle</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
              <th className="px-4 py-3 text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !hasData && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Aucune donnee</td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Chargement...</td>
              </tr>
            )}

            {rows.map((row, index) => (
              <tr key={row._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.numero}</td>
                <td className="px-4 py-3 text-gray-700">{row.libelle}</td>
                <td className="px-4 py-3 text-gray-700">{row.type}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.totalDebit)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.totalCredit)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${Number(row.solde) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(row.solde)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold text-gray-900">
              <td colSpan={3} className="px-4 py-3">Totaux</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totaux.totalDebit)}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totaux.totalCredit)}</td>
              <td className={`px-4 py-3 text-right ${Number(totaux.solde) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totaux.solde)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Balance;
