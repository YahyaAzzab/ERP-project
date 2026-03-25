import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Briefcase, CircleDollarSign, Users, Eye, Pencil, Ban, History, FileText } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ExportModal from '../../components/common/ExportModal';
import SearchBar from '../../components/common/SearchBar';
import { createEmploye, deleteEmploye, getEmployes, getStatistiquesRH, updateEmploye } from '../../services/rhService';
import { useAuth } from '../../context/AuthContext';
import { exportEmployesPDF } from '../../utils/exportPDF';

const DEPARTEMENTS = ['Finance', 'RH', 'Commercial', 'Achats', 'Production', 'Direction'];
const STATUTS = ['TOUS', 'ACTIF', 'CONGE', 'SUSPENDU', 'INACTIF'];
const CONTRATS = ['CDI', 'CDD', 'STAGE'];

const extractEmployes = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.employes)) return data.employes;
  return [];
};

const formatCurrency = (value) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(value || 0));
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '-');

const getCurrentStatusEntry = (employe) => {
  const history = Array.isArray(employe?.historiqueStatuts) ? employe.historiqueStatuts : [];
  if (history.length === 0) return null;
  const open = history.find((h) => !h?.dateFin);
  if (open) return open;
  return [...history].sort((a, b) => new Date(b.dateDebut || 0) - new Date(a.dateDebut || 0))[0];
};

const computeDuration = (start, end) => {
  if (!start) return '-';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  return `${days} jour(s)`;
};

const Employes = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employes, setEmployes] = useState([]);
  const [stats, setStats] = useState({ totalEmployesActifs: 0, masseSalariale: 0 });
  const [search, setSearch] = useState('');
  const [departement, setDepartement] = useState('');
  const [statut, setStatut] = useState('TOUS');
  const [modal, setModal] = useState({ open: false, mode: 'create', employe: null });
  const [details, setDetails] = useState({ open: false, employe: null });
  const [historyModal, setHistoryModal] = useState({ open: false, employe: null });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      poste: '',
      departement: 'Finance',
      dateEmbauche: new Date().toISOString().slice(0, 10),
      salaireBrut: '',
      typeContrat: 'CDI',
      statut: 'ACTIF',
    },
  });

  const watchedStatut = watch('statut');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (departement) params.departement = departement;
      if (statut !== 'TOUS') params.statut = statut;

      const [empResponse, statsResponse] = await Promise.all([
        getEmployes(params),
        getStatistiquesRH(),
      ]);

      setEmployes(extractEmployes(empResponse));
      setStats(statsResponse?.data?.data || { totalEmployesActifs: 0, masseSalariale: 0 });
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement RH impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, departement, statut]);

  const openCreate = () => {
    reset({
      nom: '', prenom: '', email: '', poste: '', departement: 'Finance',
      dateEmbauche: new Date().toISOString().slice(0, 10), salaireBrut: '', typeContrat: 'CDI', statut: 'ACTIF',
    });
    setModal({ open: true, mode: 'create', employe: null });
  };

  const openEdit = (employe) => {
    reset({
      nom: employe.nom,
      prenom: employe.prenom,
      email: employe.email || '',
      poste: employe.poste,
      departement: employe.departement,
      dateEmbauche: employe.dateEmbauche ? new Date(employe.dateEmbauche).toISOString().slice(0, 10) : '',
      salaireBrut: employe.salaireBrut,
      typeContrat: employe.typeContrat || 'CDI',
      statut: employe.statut || 'ACTIF',
      motif: '',
      dateDebutStatut: new Date().toISOString().slice(0, 10),
      dateFinStatut: '',
    });
    setModal({ open: true, mode: 'edit', employe });
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        salaireBrut: Number(values.salaireBrut),
      };

      if (modal.mode === 'edit' && modal.employe?.statut !== values.statut) {
        if (!values.motif?.trim()) {
          setErrorMsg('Le motif du changement de statut est obligatoire.');
          return;
        }
        payload.motif = values.motif;
        payload.dateDebutStatut = values.dateDebutStatut || new Date().toISOString().slice(0, 10);
        payload.dateFinStatut = values.dateFinStatut || undefined;
      }

      if (modal.mode === 'create') {
        await createEmploye(payload);
      } else {
        await updateEmploye(modal.employe._id, payload);
      }
      setModal({ open: false, mode: 'create', employe: null });
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Enregistrement employe impossible.');
    }
  };

  const onDeactivate = async (row) => {
    if (!window.confirm(`Desactiver ${row.prenom} ${row.nom} ?`)) return;
    try {
      await deleteEmploye(row._id);
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Desactivation impossible.');
    }
  };

  const columns = useMemo(() => [
    { Header: 'Matricule', accessor: 'matricule' },
    { Header: 'Nom Prenom', accessor: 'fullName', Cell: ({ value }) => <span className="font-medium">{value}</span> },
    { Header: 'Poste', accessor: 'poste' },
    { Header: 'Departement', accessor: 'departement' },
    { Header: 'Contrat', accessor: 'typeContrat', Cell: ({ value }) => <Badge status={value || 'CDI'} /> },
    { Header: 'Salaire', accessor: 'salaireBrut', Cell: ({ value }) => formatCurrency(value) },
    {
      Header: 'Statut',
      accessor: 'statutInfo',
      Cell: ({ value }) => (
        <div className="leading-tight">
          <Badge status={value.statut} />
          <div className="text-xs text-gray-500 mt-1">Depuis {formatDate(value.depuis)}</div>
        </div>
      ),
    },
    { Header: 'Actions', accessor: 'actions' },
  ], []);

  const rows = employes.map((e) => ({
    ...e,
    fullName: `${e.prenom || ''} ${e.nom || ''}`.trim(),
    statutInfo: {
      statut: e.statut,
      depuis: getCurrentStatusEntry(e)?.dateDebut || e.dateEmbauche,
    },
    actions: (
      <div className="flex items-center gap-2">
        <button title="Voir details" onClick={() => setDetails({ open: true, employe: e })} className="p-1 text-gray-700 hover:text-black hover:scale-110 transition"><Eye size={18} /></button>
        <button title="Modifier" onClick={() => openEdit(e)} className="p-1 text-blue-600 hover:text-blue-800 hover:scale-110 transition"><Pencil size={18} /></button>
        <button title="Desactiver" onClick={() => onDeactivate(e)} className="p-1 text-red-600 hover:text-red-800 hover:scale-110 transition"><Ban size={18} /></button>
        <button title="Historique" onClick={() => setHistoryModal({ open: true, employe: e })} className="p-1 text-indigo-600 hover:text-indigo-800 hover:scale-110 transition"><History size={18} /></button>
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard title="Total employes" value={employes.length} icon={<Users className="text-white" size={20} />} color="bg-blue-500" />
        <StatCard title="Actifs" value={stats.totalEmployesActifs || employes.filter((e) => e.statut === 'ACTIF').length} icon={<Briefcase className="text-white" size={20} />} color="bg-green-500" />
        <StatCard title="Masse salariale" value={formatCurrency(stats.masseSalariale || employes.reduce((s, e) => s + Number(e.salaireBrut || 0), 0))} icon={<CircleDollarSign className="text-white" size={20} />} color="bg-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Employes</h2>
          <div className="flex items-center gap-2">
            {hasRole('ADMIN', 'RH') && (
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm"
              >
                <FileText size={16} /> Exporter PDF
              </button>
            )}
            {hasRole('ADMIN', 'RH') && (
              <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">+ Nouvel Employe</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchBar placeholder="Rechercher nom, prenom ou matricule" value={search} onSearch={setSearch} />
          <select value={departement} onChange={(e) => setDepartement(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            <option value="">Tous departements</option>
            {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            {STATUTS.map((s) => <option key={s} value={s}>{s === 'TOUS' ? 'Tous statuts' : s}</option>)}
          </select>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', employe: null })} title={modal.mode === 'create' ? 'Nouvel employe' : 'Modifier employe'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Nom</label>
            <input {...register('nom', { required: 'Nom requis' })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            {errors.nom && <p className="text-xs text-red-600 mt-1">{errors.nom.message}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-600">Prenom</label>
            <input {...register('prenom', { required: 'Prenom requis' })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            {errors.prenom && <p className="text-xs text-red-600 mt-1">{errors.prenom.message}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input type="email" {...register('email', { required: 'Email requis' })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-600">Poste</label>
            <input {...register('poste', { required: 'Poste requis' })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            {errors.poste && <p className="text-xs text-red-600 mt-1">{errors.poste.message}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-600">Departement</label>
            <select {...register('departement', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Date embauche</label>
            <input type="date" {...register('dateEmbauche', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Salaire brut</label>
            <input type="number" min="0" step="0.01" {...register('salaireBrut', { required: true, min: 0 })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Type contrat</label>
            <select {...register('typeContrat')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              {CONTRATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {modal.mode === 'edit' && (
            <div>
              <label className="text-sm text-gray-600">Statut</label>
              <select {...register('statut')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
                {STATUTS.filter((s) => s !== 'TOUS').map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

            {modal.mode === 'edit' && modal.employe?.statut !== undefined && watchedStatut !== modal.employe?.statut && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Date debut du nouveau statut</label>
                  <input type="date" {...register('dateDebutStatut')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date de fin prevue (optionnel)</label>
                  <input type="date" {...register('dateFinStatut')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Motif du changement de statut</label>
                  <textarea rows={2} {...register('motif')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
                </div>
              </>
            )}

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', employe: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={historyModal.open} onClose={() => setHistoryModal({ open: false, employe: null })} title="Historique des statuts" size="lg">
        {historyModal.employe && (
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-gray-800">{historyModal.employe.prenom} {historyModal.employe.nom}</p>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="px-3 py-2 text-left">Date debut</th>
                    <th className="px-3 py-2 text-left">Date fin</th>
                    <th className="px-3 py-2 text-left">Duree</th>
                    <th className="px-3 py-2 text-left">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyModal.employe.historiqueStatuts || []).map((entry, idx) => (
                    <tr key={`${entry.dateDebut}-${idx}`} className="border-t border-gray-100">
                      <td className="px-3 py-2"><Badge status={entry.statut} /></td>
                      <td className="px-3 py-2">{formatDate(entry.dateDebut)}</td>
                      <td className="px-3 py-2">{entry.dateFin ? formatDate(entry.dateFin) : 'En cours'}</td>
                      <td className="px-3 py-2">{computeDuration(entry.dateDebut, entry.dateFin)}</td>
                      <td className="px-3 py-2">{entry.motif || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter les employes en PDF"
        rowsCount={employes.length}
        options={[
          { key: 'includeSalaire', label: 'Inclure salaires', defaultChecked: true },
          { key: 'includeCoordonnees', label: 'Inclure coordonnees personnelles', defaultChecked: true },
          { key: 'includeDateEmbauche', label: 'Inclure date embauche', defaultChecked: true },
        ]}
        onExport={({ selectedOptions, dateDebut, dateFin }) => {
          exportEmployesPDF(
            employes,
            { departement, statut, dateDebut, dateFin },
            {
              includeSalaire: selectedOptions.includes('includeSalaire'),
              includeCoordonnees: selectedOptions.includes('includeCoordonnees'),
              includeDateEmbauche: selectedOptions.includes('includeDateEmbauche'),
            }
          );
          setIsExportOpen(false);
        }}
      />

      <Modal isOpen={details.open} onClose={() => setDetails({ open: false, employe: null })} title="Detail employe" size="md">
        {details.employe && (
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Matricule:</span> <strong>{details.employe.matricule}</strong></p>
            <p><span className="text-gray-500">Nom complet:</span> <strong>{details.employe.prenom} {details.employe.nom}</strong></p>
            <p><span className="text-gray-500">Poste:</span> {details.employe.poste}</p>
            <p><span className="text-gray-500">Departement:</span> {details.employe.departement}</p>
            <p><span className="text-gray-500">Contrat:</span> <Badge status={details.employe.typeContrat || 'CDI'} /></p>
            <p><span className="text-gray-500">Salaire brut:</span> <strong>{formatCurrency(details.employe.salaireBrut)}</strong></p>
            <p><span className="text-gray-500">Statut:</span> <Badge status={details.employe.statut} /></p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employes;
