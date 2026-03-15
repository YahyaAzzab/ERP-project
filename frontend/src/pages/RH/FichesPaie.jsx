import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import { deleteFichePaie, genererFichePaie, getEmployes, getFichesPaie } from '../../services/rhService';

const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

const extractFiches = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.fiches)) return data.fiches;
  return [];
};

const extractEmployes = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.employes)) return data.employes;
  return [];
};

const formatCurrency = (value) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(value || 0));

const FichesPaie = () => {
  const now = new Date();
  const [loading, setLoading] = useState(false);
  const [fiches, setFiches] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedEmploye, setSelectedEmploye] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [details, setDetails] = useState({ open: false, fiche: null });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [fichesResponse, employesResponse] = await Promise.all([
        getFichesPaie({ mois: selectedMonth, annee: selectedYear }),
        getEmployes({ statut: 'ACTIF', limit: 100 }),
      ]);

      setFiches(extractFiches(fichesResponse));
      setEmployes(extractEmployes(employesResponse));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des fiches impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const onGenerate = async () => {
    if (!selectedEmploye) {
      setErrorMsg('Selectionnez un employe pour generer la fiche.');
      return;
    }

    try {
      await genererFichePaie({ employeId: selectedEmploye, mois: Number(selectedMonth), annee: Number(selectedYear) });
      setSelectedEmploye('');
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Generation impossible.');
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm('Supprimer cette fiche de paie ?')) return;
    try {
      await deleteFichePaie(row._id);
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  const columns = useMemo(() => [
    { Header: 'Employe', accessor: 'employeNom' },
    { Header: 'Poste', accessor: 'poste' },
    { Header: 'Brut', accessor: 'salaireBrut', Cell: ({ value }) => formatCurrency(value) },
    { Header: 'Cotisations', accessor: 'cotisations', Cell: ({ value }) => formatCurrency(value) },
    { Header: 'Net', accessor: 'salaireNet', Cell: ({ value }) => formatCurrency(value) },
    { Header: 'Date generation', accessor: 'dateGeneration' },
    {
      Header: 'Actions', accessor: 'actions',
    },
  ], []);

  const rows = fiches.map((f) => {
    const cotisations = Number(f.cotisationsSalariales || f.totalCotisationsSalariales || f.cotisations || 0);
    const generationDate = f.dateGeneration || f.createdAt;

    return {
      ...f,
      employeNom: `${f.employe?.prenom || ''} ${f.employe?.nom || ''}`.trim() || '-',
      poste: f.employe?.poste || '-',
      cotisations,
      dateGeneration: generationDate ? new Date(generationDate).toISOString().slice(0, 10) : '-',
      actions: (
        <div className="flex gap-2">
          <button onClick={() => setDetails({ open: true, fiche: f })} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Voir detail</button>
          <button onClick={() => onDelete(f)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Supprimer</button>
        </div>
      ),
    };
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fiches de paie</h2>
          <p className="text-sm text-gray-500">Generation et consultation des bulletins de paie.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-300">
            {monthNames.map((month, idx) => <option key={month} value={idx + 1}>{month}</option>)}
          </select>
          <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-300" />
          <select value={selectedEmploye} onChange={(e) => setSelectedEmploye(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            <option value="">Selectionner employe</option>
            {employes.map((e) => <option key={e._id} value={e._id}>{e.matricule} - {e.prenom} {e.nom}</option>)}
          </select>
          <button onClick={onGenerate} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Generer les fiches</button>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

      <Modal isOpen={details.open} onClose={() => setDetails({ open: false, fiche: null })} title="Detail fiche de paie" size="md">
        {details.fiche && (
          <div className="space-y-3 text-sm">
            <div className="text-gray-700">
              <p className="font-semibold">{details.fiche.employe?.prenom} {details.fiche.employe?.nom}</p>
              <p className="text-gray-500">{details.fiche.employe?.poste || '-'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
              <div className="flex justify-between"><span>Salaire brut</span><strong>{formatCurrency(details.fiche.salaireBrut)}</strong></div>
              <div className="flex justify-between"><span>- Cotisations salariales (22%)</span><strong>{formatCurrency(details.fiche.cotisationsSalariales || details.fiche.totalCotisationsSalariales || 0)}</strong></div>
              <div className="flex justify-between text-base border-t pt-2"><span>= Salaire net</span><strong>{formatCurrency(details.fiche.salaireNet)}</strong></div>
              <div className="text-xs text-gray-500 pt-2">Cotisations patronales (30%) info: {formatCurrency(details.fiche.cotisationsPatronales || 0)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FichesPaie;
