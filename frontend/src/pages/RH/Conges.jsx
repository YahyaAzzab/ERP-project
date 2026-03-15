import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { annulerConge, createConge, getConges, getEmployes, traiterConge } from '../../services/rhService';
import { useAuth } from '../../context/AuthContext';

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
      await traiterConge(row._id, { statut: 'APPROUVE' });
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Action impossible.');
    }
  };

  const onReject = async (row) => {
    try {
      await traiterConge(row._id, { statut: 'REFUSE' });
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

  const rows = conges.map((c) => {
    const jours = c.nombreJours || businessDays(c.dateDebut, c.dateFin);
    const isPending = c.statut === 'EN_ATTENTE';

    return {
      ...c,
      employeName: `${c.employe?.prenom || ''} ${c.employe?.nom || ''}`.trim() || '-',
      jours,
      actions: (
        <div className="flex flex-wrap gap-2">
          {canApprove && isPending && (
            <>
              <button onClick={() => onApprove(c)} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">Approuver</button>
              <button onClick={() => onReject(c)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Refuser</button>
            </>
          )}
          {isPending && (
            <button onClick={() => onCancel(c)} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Annuler</button>
          )}
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
    </div>
  );
};

export default Conges;
