import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import ExportModal from '../../components/common/ExportModal';
import { deleteFichePaie, genererFichePaie, getEmployes, getFichesPaie } from '../../services/rhService';
import { exportFichesPaiePDF } from '../../utils/exportPDF';
import { useAuth } from '../../context/AuthContext';

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
  const { hasRole } = useAuth();
  const now = new Date();
  const [loading, setLoading] = useState(false);
  const [fiches, setFiches] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedEmploye, setSelectedEmploye] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [details, setDetails] = useState({ open: false, fiche: null });
  const [isExportOpen, setIsExportOpen] = useState(false);

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
          {hasRole('ADMIN', 'RH') && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm"
            >
              <FileText size={16} /> Exporter PDF
            </button>
          )}
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
              {(() => {
                const brut = Number(details.fiche.salaireBrut || 0);
                const cotisations = Number(details.fiche.cotisationsSalariales || details.fiche.totalCotisationsSalariales || Math.round(brut * 0.22));
                const cotisationsPatronales = Number(details.fiche.cotisationsPatronales || Math.round(brut * 0.3));
                const net = Number(details.fiche.salaireNet || (brut - cotisations));

                return (
                  <>
                    <div className="flex justify-between"><span>Salaire brut</span><strong>{formatCurrency(brut)}</strong></div>
                    <div className="flex justify-between text-red-600"><span>Cotisations salariales (22%)</span><strong>-{formatCurrency(cotisations)}</strong></div>
                    <div className="flex justify-between text-gray-600"><span>Cotisations patronales (30%)</span><strong>{formatCurrency(cotisationsPatronales)}</strong></div>
                    <div className="flex justify-between text-base border-t pt-2 text-green-700"><span>Salaire net</span><strong>{formatCurrency(net)}</strong></div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter les fiches de paie en PDF"
        rowsCount={fiches.length}
        onExport={() => {
          exportFichesPaiePDF(fiches);
          setIsExportOpen(false);
        }}
      />
    </div>
  );
};

export default FichesPaie;
