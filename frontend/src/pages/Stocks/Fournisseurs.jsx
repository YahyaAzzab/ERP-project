import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import { createFournisseur, deleteFournisseur, getFournisseurs, updateFournisseur } from '../../services/stocksService';
import { useAuth } from '../../context/AuthContext';

const parseList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.fournisseurs)) return data.fournisseurs;
  return [];
};

const Fournisseurs = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fournisseurs, setFournisseurs] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', fournisseur: null });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      nom: '',
      email: '',
      telephone: '',
      'adresse.ville': '',
      'adresse.rue': '',
      notes: '',
    },
  });

  const fetchFournisseurs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await getFournisseurs({ search: search.trim() || undefined, limit: 100 });
      setFournisseurs(parseList(response));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des fournisseurs impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFournisseurs();
  }, [search]);

  const openCreate = () => {
    reset({ nom: '', email: '', telephone: '', 'adresse.ville': '', 'adresse.rue': '', notes: '' });
    setModal({ open: true, mode: 'create', fournisseur: null });
  };

  const openEdit = (f) => {
    reset({
      nom: f.nom || '',
      email: f.email || '',
      telephone: f.telephone || '',
      'adresse.ville': f.adresse?.ville || '',
      'adresse.rue': f.adresse?.rue || '',
      notes: f.notes || '',
    });
    setModal({ open: true, mode: 'edit', fournisseur: f });
  };

  const onSubmit = async (values) => {
    const payload = {
      nom: values.nom,
      email: values.email || undefined,
      telephone: values.telephone || undefined,
      adresse: {
        ville: values['adresse.ville'] || undefined,
        rue: values['adresse.rue'] || undefined,
      },
      notes: values.notes || undefined,
    };

    try {
      if (modal.mode === 'create') await createFournisseur(payload);
      else await updateFournisseur(modal.fournisseur._id, payload);
      setModal({ open: false, mode: 'create', fournisseur: null });
      fetchFournisseurs();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Enregistrement fournisseur impossible.');
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Supprimer ${row.nom} ?`)) return;
    try {
      await deleteFournisseur(row._id);
      fetchFournisseurs();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Suppression fournisseur impossible.');
    }
  };

  const columns = [
    { Header: 'Nom', accessor: 'nom' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Telephone', accessor: 'telephone' },
    { Header: 'Ville', accessor: 'ville' },
  ];

  const rows = fournisseurs.map((f) => ({ ...f, ville: f.adresse?.ville || '-' }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Fournisseurs</h2>
          {isAdmin && (
            <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">+ Nouveau Fournisseur</button>
          )}
        </div>
        <SearchBar placeholder="Rechercher nom ou ville" value={search} onSearch={setSearch} />
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} onEdit={isAdmin ? openEdit : undefined} onDelete={isAdmin ? onDelete : undefined} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', fournisseur: null })} title={modal.mode === 'create' ? 'Nouveau fournisseur' : 'Modifier fournisseur'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Nom</label>
            <input {...register('nom', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input type="email" {...register('email')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Telephone</label>
            <input {...register('telephone')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Ville</label>
            <input {...register('adresse.ville')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Rue</label>
            <input {...register('adresse.rue')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Notes</label>
            <textarea rows={2} {...register('notes')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', fournisseur: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Fournisseurs;
