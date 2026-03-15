import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { createEcriture, getComptes, getEcritures } from '../../services/comptaService';

const extractComptes = (response) => response?.data?.data?.comptes || [];
const extractEcritures = (response) => response?.data?.data?.ecritures || [];

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
};

const Ecritures = () => {
  const [loading, setLoading] = useState(false);
  const [ecritures, setEcritures] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      libelle: '',
      compteId: '',
      journal: 'GENERAL',
      montantDebit: 0,
      montantCredit: 0,
      reference: '',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [ecrituresResponse, comptesResponse] = await Promise.all([
        getEcritures(),
        getComptes({ actif: true }),
      ]);
      setEcritures(extractEcritures(ecrituresResponse));
      setComptes(extractComptes(comptesResponse));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des ecritures impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreate = async (values) => {
    try {
      await createEcriture({
        ...values,
        montantDebit: Number(values.montantDebit || 0),
        montantCredit: Number(values.montantCredit || 0),
      });
      setIsOpen(false);
      reset();
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Creation ecriture impossible.');
    }
  };

  const columns = [
    { Header: 'Date', accessor: 'date', Cell: ({ value }) => new Date(value).toISOString().slice(0, 10) },
    { Header: 'Libelle', accessor: 'libelle' },
    { Header: 'Compte', accessor: 'compte', Cell: ({ value }) => `${value?.numero || '-'} ${value?.libelle || ''}` },
    { Header: 'Journal', accessor: 'journal' },
    { Header: 'Debit', accessor: 'montantDebit', Cell: ({ value }) => formatCurrency(value) },
    { Header: 'Credit', accessor: 'montantCredit', Cell: ({ value }) => formatCurrency(value) },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ecritures comptables</h2>
          <p className="text-sm text-gray-500">Journal des mouvements debit/credit.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">+ Nouvelle ecriture</button>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={ecritures} loading={loading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nouvelle ecriture" size="md">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Date</label>
            <input type="date" {...register('date', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Libelle</label>
            <input {...register('libelle', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Compte</label>
            <select {...register('compteId', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              <option value="">Selectionner un compte</option>
              {comptes.map((c) => <option key={c._id} value={c._id}>{c.numero} - {c.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Journal</label>
            <select {...register('journal')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              {['GENERAL', 'VENTES', 'ACHATS', 'BANQUE', 'CAISSE', 'OD'].map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-gray-600">Debit</label>
              <input type="number" step="0.01" min="0" {...register('montantDebit')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Credit</label>
              <input type="number" step="0.01" min="0" {...register('montantCredit')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">Reference</label>
            <input {...register('reference')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Ecritures;
