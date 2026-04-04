import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, Pencil, Trash2, KeyRound, UserPlus, Settings } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from '../../services/settingsService';

const ROLES = ['ADMIN', 'COMPTABLE', 'RH', 'MAGASINIER'];

const extractUsers = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  return [];
};

const Parametres = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('TOUS');
  const [actif, setActif] = useState('TOUS');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', user: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, user: null });
  const [passwordModal, setPasswordModal] = useState({ open: false, user: null });

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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 inline-flex items-center gap-2"><Settings size={20} /> Parametres</h2>
            <p className="text-sm text-gray-500">Administration des profils utilisateurs et de leurs acces.</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2"
          >
            <UserPlus size={16} /> Nouveau profil
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
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

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">{successMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

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
