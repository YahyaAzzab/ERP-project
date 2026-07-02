import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, XCircle, Ban, Eye, FileText } from 'lucide-react';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import ExportModal from '../../components/common/ExportModal';
import { annulerConge, createConge, getCongeById, getConges, getEmployes, getSoldeConges, traiterConge } from '../../services/rhService';
import { useAuth } from '../../context/AuthContext';
import { exportCongesPDF } from '../../utils/exportPDF';

const TYPES_CONGE = ['ANNUEL', 'MALADIE', 'SANS_SOLDE', 'MATERNITE', 'PATERNITE'];
const STATUTS = ['TOUS', 'EN_ATTENTE', 'APPROUVE', 'REFUSE'];

const extractConges = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.conges)) return data.conges;
  return [];
};

const extractEmployes = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.employes)) return data.employes;
  return [];
};

const formatDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '-');

const businessDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const Conges = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [conges, setConges] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [statut, setStatut] = useState('TOUS');
  const [errorMsg, setErrorMsg] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState({ open: false, conge: null });
  const [traitementModal, setTraitementModal] = useState({ open: false, conge: null, statut: 'APPROUVE' });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [commentaireRH, setCommentaireRH] = useState('');
  const [soldeInfo, setSoldeInfo] = useState({ loading: false, data: null, error: '' });

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      employeId: '',
      type: 'ANNUEL',
      dateDebut: new Date().toISOString().slice(0, 10),
      dateFin: new Date().toISOString().slice(0, 10),
      motif: '',
    },
  });

  const watchedStart = watch('dateDebut');
  const watchedEnd = watch('dateFin');
  const watchedEmployeId = watch('employeId');
  const watchedType = watch('type');

  const currentUserRole = String(user?.role || '').toUpperCase();
  const canApprove = currentUserRole === 'ADMIN' || currentUserRole === 'RH';

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (statut !== 'TOUS') params.statut = statut;

      const [congesResponse, employesResponse] = await Promise.all([
        getConges(params),
        getEmployes({ statut: 'ACTIF', limit: 100 }),
      ]);

      setConges(extractConges(congesResponse));
      setEmployes(extractEmployes(employesResponse));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des conges impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statut]);

  useEffect(() => {
    const loadSolde = async () => {
      if (!isOpen || !watchedEmployeId || watchedType !== 'ANNUEL') {
        setSoldeInfo({ loading: false, data: null, error: '' });
        return;
      }

      setSoldeInfo({ loading: true, data: null, error: '' });

      try {
        const response = await getSoldeConges(watchedEmployeId);
        setSoldeInfo({
          loading: false,
          data: response?.data?.data || null,
          error: '',
        });
      } catch (error) {
        setSoldeInfo({
          loading: false,
          data: null,
          error: error?.response?.data?.message || 'Impossible de recuperer le solde de conges.',
        });
      }
    };

    loadSolde();
  }, [isOpen, watchedEmployeId, watchedType]);

  const onSubmit = async (values) => {
    try {
      await createConge(values);
      setIsOpen(false);
      reset();
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Creation de conge impossible.');
    }
  };

  const onApprove = async (row) => {
    try {
      await traiterConge(row._id, { statut: 'APPROUVE', commentaireRH });
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Action impossible.');
    }
  };

  const onReject = async (row) => {
    try {
      await traiterConge(row._id, { statut: 'REFUSE', commentaireRH });
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Action impossible.');
    }
  };

  const onCancel = async (row) => {
    try {
      await annulerConge(row._id);
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Annulation impossible.');
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Employe',
      accessor: 'employeName',
    },
    { Header: 'Type', accessor: 'type' },
    { Header: 'Date debut', accessor: 'dateDebut', Cell: ({ value }) => formatDate(value) },
    { Header: 'Date fin', accessor: 'dateFin', Cell: ({ value }) => formatDate(value) },
    { Header: 'Jours', accessor: 'jours' },
    { Header: 'Statut', accessor: 'statut', Cell: ({ value }) => <Badge status={value} /> },
    { Header: 'Actions', accessor: 'actions' },
  ], []);

  const openDetails = async (row) => {
    try {
      const response = await getCongeById(row._id);
      setDetailsModal({ open: true, conge: response?.data?.data || row });
    } catch {
      setDetailsModal({ open: true, conge: row });
    }
  };

  const openTraitement = (row, nextStatut) => {
    setCommentaireRH('');
    setTraitementModal({ open: true, conge: row, statut: nextStatut });
  };

  const submitTraitement = async () => {
    if (!commentaireRH.trim()) {
      setErrorMsg('Le commentaire RH est obligatoire pour traiter le conge.');
      return;
    }

    if (traitementModal.statut === 'APPROUVE') await onApprove(traitementModal.conge);
    if (traitementModal.statut === 'REFUSE') await onReject(traitementModal.conge);

    setTraitementModal({ open: false, conge: null, statut: 'APPROUVE' });
    setCommentaireRH('');
  };

  const rows = conges.map((c) => {
    const jours = c.nombreJours || businessDays(c.dateDebut, c.dateFin);
    const isPending = c.statut === 'EN_ATTENTE';

    return {
      ...c,
      employeName: `${c.employe?.prenom || ''} ${c.employe?.nom || ''}`.trim() || '-',
      jours,
      actions: (
        <div className="flex items-center gap-2">
          {canApprove && isPending && (
            <>
              <button title="Approuver" onClick={() => openTraitement(c, 'APPROUVE')} className="p-1 text-green-600 hover:text-green-800 hover:scale-110 transition"><CheckCircle2 size={18} /></button>
              <button title="Refuser" onClick={() => openTraitement(c, 'REFUSE')} className="p-1 text-red-600 hover:text-red-800 hover:scale-110 transition"><XCircle size={18} /></button>
            </>
          )}
          {isPending && (
            <button title="Annuler" onClick={() => onCancel(c)} className="p-1 text-gray-700 hover:text-black hover:scale-110 transition"><Ban size={18} /></button>
          )}
          <button title="Voir details" onClick={() => openDetails(c)} className="p-1 text-blue-600 hover:text-blue-800 hover:scale-110 transition"><Eye size={18} /></button>
        </div>
      ),
    };
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Conges</h2>
          <p className="text-sm text-gray-500">Demandes de conges et workflow d'approbation.</p>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm"
            >
              <FileText size={16} /> Exporter PDF
            </button>
          )}
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
            {STATUTS.map((s) => <option key={s} value={s}>{s === 'TOUS' ? 'Tous' : s}</option>)}
          </select>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">+ Nouvelle Demande</button>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nouvelle demande de conge" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Employe</label>
            <select {...register('employeId', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              <option value="">Selectionner</option>
              {employes.map((e) => (
                <option key={e._id} value={e._id}>{e.matricule} - {e.prenom} {e.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Type de conge</label>
            <select {...register('type', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              {TYPES_CONGE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-gray-600">Date debut</label>
              <input type="date" {...register('dateDebut', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Date fin</label>
              <input type="date" {...register('dateFin', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
          </div>

          <div className="text-xs text-gray-500">Jours ouvres estimes: <strong>{businessDays(watchedStart, watchedEnd)}</strong></div>

          {watchedType === 'ANNUEL' && watchedEmployeId && (
            <div className="text-xs rounded-md border border-blue-100 bg-blue-50 text-blue-800 px-3 py-2">
              {soldeInfo.loading && <span>Chargement du solde de conges annuels...</span>}

              {!soldeInfo.loading && soldeInfo.error && <span>{soldeInfo.error}</span>}

              {!soldeInfo.loading && !soldeInfo.error && soldeInfo.data && (
                <span>
                  Solde annuel restant: <strong>{soldeInfo.data.soldeActuel ?? 0} jour(s)</strong>
                  {' | '}Pris cette annee: <strong>{soldeInfo.data.totalPris ?? 0} jour(s)</strong>
                  {' | '}En attente: <strong>{Array.isArray(soldeInfo.data.congesEnAttente) ? soldeInfo.data.congesEnAttente.length : 0}</strong>
                </span>
              )}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600">Motif</label>
            <textarea rows={3} {...register('motif')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, conge: null })} title="Details conge" size="lg">
        {detailsModal.conge && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><span className="text-gray-500">Employe:</span> <strong>{detailsModal.conge.employe?.prenom} {detailsModal.conge.employe?.nom}</strong></p>
              <p><span className="text-gray-500">Matricule:</span> {detailsModal.conge.employe?.matricule || '-'}</p>
              <p><span className="text-gray-500">Departement:</span> {detailsModal.conge.employe?.departement || '-'}</p>
              <p><span className="text-gray-500">Solde annuel restant:</span> {detailsModal.conge.employe?.soldeConges ?? '-'}</p>
              <p><span className="text-gray-500">Type:</span> {detailsModal.conge.type}</p>
              <p><span className="text-gray-500">Periode:</span> {formatDate(detailsModal.conge.dateDebut)} - {formatDate(detailsModal.conge.dateFin)}</p>
              <p><span className="text-gray-500">Jours ouvres:</span> {detailsModal.conge.nombreJours || businessDays(detailsModal.conge.dateDebut, detailsModal.conge.dateFin)}</p>
              <p><span className="text-gray-500">Statut:</span> <Badge status={detailsModal.conge.statut} /></p>
              <p><span className="text-gray-500">Date demande:</span> {formatDate(detailsModal.conge.createdAt)}</p>
              <p><span className="text-gray-500">Traite par:</span> {detailsModal.conge.traitePar ? `${detailsModal.conge.traitePar.prenom || ''} ${detailsModal.conge.traitePar.nom || ''}`.trim() : '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Motif:</p>
              <p className="font-medium">{detailsModal.conge.motif || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Commentaire RH:</p>
              <p className="font-medium">{detailsModal.conge.commentaireRH || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={traitementModal.open}
        onClose={() => setTraitementModal({ open: false, conge: null, statut: 'APPROUVE' })}
        title={traitementModal.statut === 'APPROUVE' ? 'Approuver le conge' : 'Refuser le conge'}
        size="md"
      >
        {traitementModal.conge && (
          <div className="space-y-3">
            <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
              <p><strong>{traitementModal.conge.employe?.prenom} {traitementModal.conge.employe?.nom}</strong></p>
              <p>{traitementModal.conge.type} - {formatDate(traitementModal.conge.dateDebut)} au {formatDate(traitementModal.conge.dateFin)}</p>
              <p>{traitementModal.conge.nombreJours || businessDays(traitementModal.conge.dateDebut, traitementModal.conge.dateFin)} jour(s)</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Commentaire RH</label>
              <textarea
                rows={3}
                value={commentaireRH}
                onChange={(e) => setCommentaireRH(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTraitementModal({ open: false, conge: null, statut: 'APPROUVE' })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
              <button
                type="button"
                onClick={submitTraitement}
                className={`px-4 py-2 rounded-lg text-white ${traitementModal.statut === 'APPROUVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {traitementModal.statut === 'APPROUVE' ? 'Approuver' : 'Refuser'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter les conges en PDF"
        rowsCount={conges.length}
        onExport={({ dateDebut, dateFin }) => {
          exportCongesPDF(conges, { statut, dateDebut, dateFin });
          setIsExportOpen(false);
        }}
      />
    </div>
  );
};

export default Conges;
