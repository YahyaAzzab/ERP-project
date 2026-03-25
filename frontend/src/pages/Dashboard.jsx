import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Users, Boxes, FileWarning } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import {
  getAlertes,
  getGraphiqueCA,
  getGraphiqueEmployesDepartement,
  getGraphiqueMouvementsStock,
  getKPIs,
} from '../services/dashboardService';

const formatCurrency = (value) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(value || 0));

const PIE_COLORS = ['#2563EB', '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [kpis, setKpis] = useState(null);
  const [caData, setCaData] = useState([]);
  const [departementsData, setDepartementsData] = useState([]);
  const [mouvementsData, setMouvementsData] = useState([]);
  const [alertes, setAlertes] = useState({ stocks: [], congesEnAttente: [], facturesImpayees: [] });
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [kpisRes, caRes, depRes, mouvRes, alertesRes] = await Promise.all([
        getKPIs(),
        getGraphiqueCA(),
        getGraphiqueEmployesDepartement(),
        getGraphiqueMouvementsStock(),
        getAlertes(),
      ]);

      setKpis(kpisRes?.data?.data || null);
      setCaData(Array.isArray(caRes?.data?.data) ? caRes.data.data : []);
      setDepartementsData(Array.isArray(depRes?.data?.data) ? depRes.data.data : []);
      setMouvementsData(Array.isArray(mouvRes?.data?.data) ? mouvRes.data.data : []);
      setAlertes(alertesRes?.data?.data || { stocks: [], congesEnAttente: [], facturesImpayees: [] });
      setLastRefreshAt(new Date());
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement dashboard impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const intervalId = setInterval(fetchDashboard, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const cards = useMemo(() => {
    const compta = kpis?.comptabilite || {};
    const rh = kpis?.rh || {};
    const stocks = kpis?.stocks || {};

    return {
      ca: compta.chiffreAffairesMoisActuel || 0,
      evolution: Number(compta.evolutionCA || 0),
      employes: rh.totalEmployesActifs || 0,
      valeurStock: stocks.valeurTotaleStock || 0,
      impayeesCount: compta.facturesImpayees || 0,
      impayeesAmount: compta.montantFacturesImpayees || 0,
    };
  }, [kpis]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale des indicateurs ERP en temps reel.</p>
        {lastRefreshAt && (
          <p className="text-xs text-gray-400 mt-1">Derniere mise a jour: {lastRefreshAt.toLocaleTimeString('fr-FR')}</p>
        )}
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="CA ce mois"
          value={formatCurrency(cards.ca)}
          icon={<TrendingUp className="text-white" size={20} />}
          color="bg-blue-600"
          trend={`${cards.evolution >= 0 ? '+' : ''}${cards.evolution.toFixed(2)}%`}
        />
        <StatCard title="Employes actifs" value={cards.employes} icon={<Users className="text-white" size={20} />} color="bg-green-600" />
        <StatCard title="Valeur stock" value={formatCurrency(cards.valeurStock)} icon={<Boxes className="text-white" size={20} />} color="bg-emerald-600" />
        <StatCard title="Factures impayees" value={`${cards.impayeesCount} | ${formatCurrency(cards.impayeesAmount)}`} icon={<FileWarning className="text-white" size={20} />} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[360px]">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">CA sur 12 mois</h2>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={caData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="ca" stroke="#2563EB" strokeWidth={3} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[360px]">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Employes par departement</h2>
          <ResponsiveContainer width="100%" height="86%">
            <PieChart>
              <Pie data={departementsData} dataKey="nombre" nameKey="departement" cx="50%" cy="45%" outerRadius={90} label>
                {departementsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[360px]">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Mouvements stocks (30 jours)</h2>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={mouvementsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="entrees" fill="#16A34A" name="Entrees" />
            <Bar dataKey="sorties" fill="#DC2626" name="Sorties" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-3">Stocks en alerte</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {(alertes.stocks || []).length === 0 && <p className="text-sm text-gray-500">Aucune alerte.</p>}
            {(alertes.stocks || []).map((a, idx) => (
              <button key={idx} onClick={() => navigate('/stocks')} className="w-full text-left p-2 rounded border border-red-100 hover:bg-red-50">
                <p className="text-sm font-medium text-gray-900">{a.reference} - {a.produit}</p>
                <p className="text-xs text-gray-600">{a.quantiteActuelle} / seuil {a.seuilAlerte}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
          <h3 className="text-sm font-semibold text-amber-700 mb-3">Conges en attente</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {(alertes.congesEnAttente || []).length === 0 && <p className="text-sm text-gray-500">Aucune alerte.</p>}
            {(alertes.congesEnAttente || []).map((a, idx) => (
              <button key={idx} onClick={() => navigate('/rh')} className="w-full text-left p-2 rounded border border-amber-100 hover:bg-amber-50">
                <p className="text-sm font-medium text-gray-900">{a.employe} - {a.type}</p>
                <p className="text-xs text-gray-600">{a.nombreJours} jour(s)</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
          <h3 className="text-sm font-semibold text-blue-700 mb-3">Factures impayees</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {(alertes.facturesImpayees || []).length === 0 && <p className="text-sm text-gray-500">Aucune alerte.</p>}
            {(alertes.facturesImpayees || []).map((a, idx) => (
              <button key={idx} onClick={() => navigate('/comptabilite/factures')} className="w-full text-left p-2 rounded border border-blue-100 hover:bg-blue-50">
                <p className="text-sm font-medium text-gray-900">{a.numero} - {a.client}</p>
                <p className="text-xs text-gray-600">{formatCurrency(a.montant)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Chargement...</div>}
    </div>
  );
};

export default Dashboard;
