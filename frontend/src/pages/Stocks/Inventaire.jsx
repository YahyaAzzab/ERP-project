import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import ExportModal from '../../components/common/ExportModal';
import { Boxes, AlertTriangle, Layers, Wallet, FileText } from 'lucide-react';
import { getInventaire } from '../../services/stocksService';
import { useAuth } from '../../context/AuthContext';
import { exportInventairePDF } from '../../utils/exportPDF';

const formatCurrency = (value) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(value || 0));

const getStockColor = (quantite, seuil) => {
  const q = Number(quantite || 0);
  const s = Number(seuil || 0);
  if (q === 0) return 'text-red-700 font-bold';
  if (q <= s) return 'text-red-600 font-semibold';
  if (q <= s * 1.25) return 'text-orange-500';
  if (q <= s * 1.5) return 'text-yellow-500';
  if (q <= s * 2) return 'text-lime-500';
  return 'text-green-600 font-medium';
};

const Inventaire = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [inventaire, setInventaire] = useState({
    produits: [],
    totalProduits: 0,
    produitsActifs: 0,
    produitsEnAlerte: 0,
    valeurTotaleStock: 0,
    valeurParCategorie: [],
  });

  const fetchInventaire = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await getInventaire();
      setInventaire(response?.data?.data || {
        produits: [], totalProduits: 0, produitsActifs: 0, produitsEnAlerte: 0, valeurTotaleStock: 0, valeurParCategorie: [],
      });
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement inventaire impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventaire();
  }, []);

  const columns = [
    { Header: 'Reference', accessor: 'reference' },
    { Header: 'Designation', accessor: 'designation' },
    { Header: 'Categorie', accessor: 'categorie' },
    { Header: 'Unite', accessor: 'unite' },
    {
      Header: 'Quantite',
      accessor: 'quantiteAffichage',
      Cell: ({ value }) => {
        if (value.quantite === 0) {
          return <span className={`inline-flex items-center gap-1 ${value.className}`}><AlertTriangle size={14} /> Rupture</span>;
        }
        return <span className={value.className}>{value.quantite} {value.unite}</span>;
      },
    },
    { Header: 'Prix unitaire', accessor: 'prixUnitaire', Cell: ({ value }) => formatCurrency(value) },
    { Header: 'Valeur totale', accessor: 'valeurTotale', Cell: ({ value }) => formatCurrency(value) },
    {
      Header: 'Alerte',
      accessor: 'enAlerte',
      Cell: ({ value }) => (
        value ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">ALERTE</span>
          : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">OK</span>
      ),
    },
  ];

  const rows = useMemo(() => {
    return (inventaire.produits || []).map((p) => ({
      ...p,
      valeurTotale: Number(p.quantiteStock || 0) * Number(p.prixUnitaire || 0),
      enAlerte: Number(p.quantiteStock || 0) <= Number(p.seuilAlerte || 0),
      quantiteAffichage: {
        quantite: Number(p.quantiteStock || 0),
        unite: p.unite || '',
        className: getStockColor(p.quantiteStock, p.seuilAlerte),
      },
    }));
  }, [inventaire.produits]);

  const totalValeurTable = rows.reduce((sum, r) => sum + Number(r.valeurTotale || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard title="Valeur totale" value={formatCurrency(inventaire.valeurTotaleStock)} icon={<Wallet className="text-white" size={18} />} color="bg-emerald-500" />
        <StatCard title="Produits actifs" value={inventaire.produitsActifs} icon={<Boxes className="text-white" size={18} />} color="bg-blue-500" />
        <StatCard title="En alerte" value={inventaire.produitsEnAlerte} icon={<AlertTriangle className="text-white" size={18} />} color="bg-red-500" />
        <StatCard title="Categories" value={(inventaire.valeurParCategorie || []).length} icon={<Layers className="text-white" size={18} />} color="bg-purple-500" />
      </div>

      {hasRole('ADMIN', 'MAGASINIER') && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm"
          >
            <FileText size={16} /> Exporter PDF
          </button>
        </div>
      )}

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
        <div className="text-sm font-semibold text-gray-700 mb-3">Valeur du stock par categorie</div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventaire.valeurParCategorie || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categorie" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="valeur" fill="#2563eb" name="Valeur" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 font-semibold text-gray-800">
        Totaux: valeur inventaire = {formatCurrency(totalValeurTable)}
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter l'inventaire en PDF"
        rowsCount={rows.length}
        onExport={() => {
          exportInventairePDF(rows);
          setIsExportOpen(false);
        }}
      />
    </div>
  );
};

export default Inventaire;
