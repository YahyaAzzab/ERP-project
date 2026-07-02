import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, Pencil, Trash2, KeyRound, UserPlus, Settings, FileText, RefreshCcw } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import {
  getUsers,
  getAuditLogs,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from '../../services/settingsService';
import { exportLogsPDF } from '../../utils/exportPDF';

const ROLES = ['ADMIN', 'COMPTABLE', 'RH', 'MAGASINIER'];
const LOG_MODULES = ['TOUS', 'AUTH', 'COMPTABILITE', 'RH', 'STOCKS', 'CLIENTS', 'MESSAGERIE', 'NOTIFICATIONS', 'DASHBOARD', 'PARAMETRES', 'GENERAL'];
const LOG_METHODS = ['TOUS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const LOG_RESULTS = ['TOUS', 'SUCCES', 'ERREUR'];

const extractUsers = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  return [];
};

const extractLogs = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.logs)) return data.logs;
  return [];
};

const extractPagination = (response) => response?.data?.pagination || {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('fr-FR') : '-');

const Parametres = ({ initialTab = 'users', showTabs = true }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('TOUS');
  const [actif, setActif] = useState('TOUS');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', user: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, user: null });
  const [passwordModal, setPasswordModal] = useState({ open: false, user: null });
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const [logModule, setLogModule] = useState('TOUS');
  const [logMethod, setLogMethod] = useState('TOUS');
  const [logResult, setLogResult] = useState('TOUS');
  const [logDateDebut, setLogDateDebut] = useState('');
  const [logDateFin, setLogDateFin] = useState('');
  const [logLimit, setLogLimit] = useState(20);
  const [logsPagination, setLogsPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      role: 'MAGASINIER',
      actif: true,
      password: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isResetting },
  } = useForm({
    defaultValues: { nouveauPassword: '' },
  });

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (role !== 'TOUS') params.role = role;
      if (actif === 'ACTIF') params.actif = true;
      if (actif === 'INACTIF') params.actif = false;

      const response = await getUsers(params);
      setUsers(extractUsers(response));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des profils impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, role, actif]);

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const params = {
        page,
        limit: logLimit,
      };

      if (logSearch.trim()) params.search = logSearch.trim();
      if (logModule !== 'TOUS') params.module = logModule;
      if (logMethod !== 'TOUS') params.method = logMethod;
      if (logResult === 'SUCCES') params.success = true;
      if (logResult === 'ERREUR') params.success = false;
      if (logDateDebut) params.dateDebut = logDateDebut;
      if (logDateFin) params.dateFin = logDateFin;

      const response = await getAuditLogs(params);
      setLogs(extractLogs(response));
      setLogsPagination(extractPagination(response));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des logs impossible.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [logSearch, logModule, logMethod, logResult, logDateDebut, logDateFin, logLimit]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const openCreate = () => {
    setSuccessMsg('');
    reset({ nom: '', prenom: '', email: '', role: 'MAGASINIER', actif: true, password: '' });
    setModal({ open: true, mode: 'create', user: null });
  };

  const openEdit = (user) => {
    setSuccessMsg('');
    reset({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      role: user.role || 'MAGASINIER',
      actif: Boolean(user.actif),
      password: '',
    });
    setModal({ open: true, mode: 'edit', user });
  };

  const onSubmit = async (values) => {
    try {
      if (modal.mode === 'create') {
        await createUser({
          nom: values.nom,
          prenom: values.prenom,
          email: values.email,
          role: values.role,
          actif: values.actif,
          password: values.password,
        });
        setSuccessMsg('Nouveau profil cree avec succes.');
      } else {
        await updateUser(modal.user._id, {
          nom: values.nom,
          prenom: values.prenom,
          email: values.email,
          role: values.role,
          actif: values.actif,
        });
        setSuccessMsg('Profil mis a jour avec succes.');
      }

      setModal({ open: false, mode: 'create', user: null });
      fetchUsers();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Operation impossible.');
    }
  };

  const onDelete = async (user) => {
    if (!window.confirm(`Supprimer le profil de ${user.prenom} ${user.nom} ?`)) return;
    try {
      await deleteUser(user._id);
      setSuccessMsg('Profil supprime avec succes.');
      fetchUsers();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  const openPasswordModal = (user) => {
    resetPasswordForm({ nouveauPassword: '' });
    setPasswordModal({ open: true, user });
  };

  const onResetPassword = async ({ nouveauPassword }) => {
    try {
      await resetUserPassword(passwordModal.user._id, nouveauPassword);
      setSuccessMsg('Mot de passe reinitialise avec succes.');
      setPasswordModal({ open: false, user: null });
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Reinitialisation du mot de passe impossible.');
    }
  };

  const columns = [
    { Header: 'Nom', accessor: 'nomComplet' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Role', accessor: 'role', Cell: ({ value }) => <Badge status={value} /> },
    { Header: 'Statut', accessor: 'statut', Cell: ({ value }) => <Badge status={value} /> },
    { Header: 'Dernier login', accessor: 'dernierLogin' },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ value }) => value,
    },
  ];

  const rows = useMemo(() => users.map((u) => ({
    ...u,
    nomComplet: `${u.prenom || ''} ${u.nom || ''}`.trim(),
    statut: u.actif ? 'ACTIF' : 'INACTIF',
    dernierLogin: u.dernierLogin ? new Date(u.dernierLogin).toLocaleString('fr-FR') : '-',
    actions: (
      <div className="flex items-center gap-2">
        <button title="Voir" onClick={() => setDetailsModal({ open: true, user: u })} className="p-1 text-gray-700 hover:text-black hover:scale-110 transition">
          <Eye size={18} />
        </button>
        <button title="Modifier" onClick={() => openEdit(u)} className="p-1 text-blue-600 hover:text-blue-800 hover:scale-110 transition">
          <Pencil size={18} />
        </button>
        <button title="Reinitialiser mot de passe" onClick={() => openPasswordModal(u)} className="p-1 text-amber-600 hover:text-amber-800 hover:scale-110 transition">
          <KeyRound size={18} />
        </button>
        <button title="Supprimer" onClick={() => onDelete(u)} className="p-1 text-red-600 hover:text-red-800 hover:scale-110 transition">
          <Trash2 size={18} />
        </button>
      </div>
    ),
  })), [users]);

  const methodClasses = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-amber-100 text-amber-800',
    PATCH: 'bg-violet-100 text-violet-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  const logColumns = [
    { Header: 'Date', accessor: 'date' },
    { Header: 'Utilisateur', accessor: 'utilisateur' },
    { Header: 'Module', accessor: 'module', Cell: ({ value }) => <Badge status={value} /> },
    {
      Header: 'Methode',
      accessor: 'method',
      Cell: ({ value }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${methodClasses[value] || 'bg-gray-100 text-gray-800'}`}>
          {value}
        </span>
      ),
    },
    { Header: 'Action', accessor: 'action' },
    { Header: 'HTTP', accessor: 'statusCode' },
    {
      Header: 'Resultat',
      accessor: 'resultat',
      Cell: ({ value }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value === 'SUCCES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value}
        </span>
      ),
    },
    { Header: 'Duree', accessor: 'duree' },
    { Header: 'IP', accessor: 'ip' },
  ];

  const logRows = useMemo(() => logs.map((l) => {
    const nomComplet = `${l.user?.prenom || ''} ${l.user?.nom || ''}`.trim();
    const userLabel = nomComplet || l.user?.email || l.email || 'Anonyme';

    return {
      ...l,
      userLabel,
      date: formatDateTime(l.createdAt),
      utilisateur: userLabel,
      module: l.module || 'GENERAL',
      method: l.method || '-',
      action: l.action || '-',
      statusCode: l.statusCode || '-',
      resultat: l.success ? 'SUCCES' : 'ERREUR',
      duree: l.durationMs !== undefined && l.durationMs !== null ? `${l.durationMs} ms` : '-',
      ip: l.ip || '-',
    };
  }), [logs]);

  const exportLogs = () => {
    exportLogsPDF(logRows, {
      recherche: logSearch,
      module: logModule !== 'TOUS' ? logModule : '',
      methode: logMethod !== 'TOUS' ? logMethod : '',
      resultat: logResult !== 'TOUS' ? logResult : '',
      dateDebut: logDateDebut,
      dateFin: logDateFin,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 inline-flex items-center gap-2"><Settings size={20} /> Parametres</h2>
            <p className="text-sm text-gray-500">
              {activeTab === 'users'
                ? 'Administration des profils utilisateurs et de leurs acces.'
                : "Suivi global des actions des utilisateurs sur ERP DOYA."}
            </p>
          </div>
          {activeTab === 'users' && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2"
            >
              <UserPlus size={16} /> Nouveau profil
            </button>
          )}
        </div>

        {showTabs && (
          <div className="mt-4 inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Gestion utilisateurs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Journal d'activite ERP DOYA
            </button>
          </div>
        )}
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">{successMsg}</div>}

      {activeTab === 'users' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SearchBar placeholder="Rechercher nom, prenom, email" value={search} onSearch={setSearch} />
              <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
                <option value="TOUS">Tous les roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={actif} onChange={(e) => setActif(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
                <option value="TOUS">Tous les statuts</option>
                <option value="ACTIF">ACTIF</option>
                <option value="INACTIF">INACTIF</option>
              </select>
            </div>
          </div>

          <DataTable columns={columns} data={rows} loading={loading} />
        </>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Journal d'activite plateforme</h3>
              <p className="text-sm text-gray-500">Suivi de toutes les actions API des utilisateurs avec date, statut et performance.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLogs(logsPagination.page || 1)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm inline-flex items-center gap-2 hover:bg-gray-50"
              >
                <RefreshCcw size={16} /> Rafraichir
              </button>
              <button
                type="button"
                onClick={exportLogs}
                disabled={logRows.length === 0}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 text-sm inline-flex items-center gap-2 hover:bg-gray-200 disabled:opacity-60"
              >
                <FileText size={16} /> Exporter PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SearchBar placeholder="Rechercher utilisateur, action, chemin" value={logSearch} onSearch={setLogSearch} />
            <select value={logModule} onChange={(e) => setLogModule(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
              {LOG_MODULES.map((m) => <option key={m} value={m}>{m === 'TOUS' ? 'Tous les modules' : m}</option>)}
            </select>
            <select value={logMethod} onChange={(e) => setLogMethod(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
              {LOG_METHODS.map((m) => <option key={m} value={m}>{m === 'TOUS' ? 'Toutes les methodes' : m}</option>)}
            </select>
            <select value={logResult} onChange={(e) => setLogResult(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
              {LOG_RESULTS.map((r) => <option key={r} value={r}>{r === 'TOUS' ? 'Tous les resultats' : r}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Date debut</label>
              <input type="date" value={logDateDebut} onChange={(e) => setLogDateDebut(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Date fin</label>
              <input type="date" value={logDateFin} onChange={(e) => setLogDateFin(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Lignes par page</label>
              <select
                value={logLimit}
                onChange={(e) => {
                  setLogLimit(Number(e.target.value));
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <DataTable columns={logColumns} data={logRows} loading={logsLoading} />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
            <p>
              Total logs: <strong>{logsPagination.total || 0}</strong> | Page <strong>{logsPagination.page || 1}</strong> / <strong>{logsPagination.totalPages || 1}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={(logsPagination.page || 1) <= 1}
                onClick={() => fetchLogs((logsPagination.page || 1) - 1)}
                className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-60"
              >
                Precedent
              </button>
              <button
                type="button"
                disabled={(logsPagination.page || 1) >= (logsPagination.totalPages || 1)}
                onClick={() => fetchLogs((logsPagination.page || 1) + 1)}
                className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-60"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', user: null })}
        title={modal.mode === 'create' ? 'Nouveau profil' : 'Modifier profil'}
        size="lg"
      >
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
            <label className="text-sm text-gray-600">Role</label>
            <select {...register('role')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {modal.mode === 'create' && (
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Mot de passe initial</label>
              <input
                type="password"
                {...register('password', {
                  required: 'Mot de passe requis',
                  minLength: { value: 8, message: 'Minimum 8 caracteres' },
                })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register('actif')} />
              Compte actif
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', user: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, user: null })} title="Detail profil" size="md">
        {detailsModal.user && (
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Nom:</span> <strong>{detailsModal.user.prenom} {detailsModal.user.nom}</strong></p>
            <p><span className="text-gray-500">Email:</span> {detailsModal.user.email}</p>
            <p><span className="text-gray-500">Role:</span> <Badge status={detailsModal.user.role} /></p>
            <p><span className="text-gray-500">Statut:</span> <Badge status={detailsModal.user.actif ? 'ACTIF' : 'INACTIF'} /></p>
            <p><span className="text-gray-500">Cree le:</span> {detailsModal.user.createdAt ? new Date(detailsModal.user.createdAt).toLocaleString('fr-FR') : '-'}</p>
            <p><span className="text-gray-500">Dernier login:</span> {detailsModal.user.dernierLogin ? new Date(detailsModal.user.dernierLogin).toLocaleString('fr-FR') : '-'}</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={passwordModal.open}
        onClose={() => setPasswordModal({ open: false, user: null })}
        title="Reinitialiser mot de passe"
        size="sm"
      >
        <form onSubmit={handleSubmitPassword(onResetPassword)} className="space-y-3">
          <div className="text-sm text-gray-600">
            Profil: <strong>{passwordModal.user?.prenom} {passwordModal.user?.nom}</strong>
          </div>
          <div>
            <label className="text-sm text-gray-600">Nouveau mot de passe</label>
            <input
              type="password"
              {...registerPassword('nouveauPassword', {
                required: 'Mot de passe requis',
                minLength: { value: 8, message: 'Minimum 8 caracteres' },
              })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
            />
            {passwordErrors.nouveauPassword && (
              <p className="text-xs text-red-600 mt-1">{passwordErrors.nouveauPassword.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPasswordModal({ open: false, user: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isResetting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {isResetting ? 'Reinitialisation...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Parametres;
