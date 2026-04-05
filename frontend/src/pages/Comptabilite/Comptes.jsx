import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ExportModal from '../../components/common/ExportModal';
import SearchBar from '../../components/common/SearchBar';
import { createCompte, deleteCompte, getBalance, getComptes, updateCompte } from '../../services/comptaService';
import { exportBalancePDF } from '../../utils/exportPDF';
import { useAuth } from '../../context/AuthContext';

const TYPES = ['TOUS', 'ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT'];

const extractComptes = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.comptes)) return data.comptes;
  return [];
};

const Comptes = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comptes, setComptes] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('TOUS');
  const [errorMsg, setErrorMsg] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', compte: null });
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      numero: '',
      libelle: '',
      type: 'ACTIF',
      description: '',
    },
  });

  const fetchComptes = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (type !== 'TOUS') params.type = type;
      const response = await getComptes(params);
      setComptes(extractComptes(response));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Impossible de charger les comptes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComptes();
  }, [search, type]);

  const openCreate = () => {
    reset({ numero: '', libelle: '', type: 'ACTIF', description: '' });
    setModal({ open: true, mode: 'create', compte: null });
  };

  const openEdit = (compte) => {
    reset({
      numero: compte.numero,
      libelle: compte.libelle,
      type: compte.type,
      description: compte.description || '',
    });
    setModal({ open: true, mode: 'edit', compte });
  };

  const onSubmit = async (values) => {
    try {
      if (modal.mode === 'create') {
        await createCompte(values);
      } else {
        await updateCompte(modal.compte._id, {
          libelle: values.libelle,
          description: values.description,
        });
      }
      setModal({ open: false, mode: 'create', compte: null });
      fetchComptes();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Enregistrement impossible.');
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Supprimer le compte ${row.numero} ?`)) return;
    try {
      await deleteCompte(row._id);
      fetchComptes();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  const columns = useMemo(() => [
    { Header: 'Numero', accessor: 'numero' },
    { Header: 'Libelle', accessor: 'libelle' },
    { Header: 'Type', accessor: 'type', Cell: ({ value }) => <Badge status={value} /> },
  ], []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Plan Comptable</h2>
            <p className="text-sm text-gray-500">Gestion des comptes comptables par type.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasRole('ADMIN', 'COMPTABLE') && (
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm"
              >
                <FileText size={16} /> Exporter PDF
              </button>
            )}
            <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">+ Nouveau compte</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <SearchBar placeholder="Rechercher numero ou libelle" value={search} onSearch={setSearch} />
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t === 'TOUS' ? 'Tous' : t}</option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={comptes} loading={loading} onEdit={openEdit} onDelete={onDelete} />

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', compte: null })}
        title={modal.mode === 'create' ? 'Nouveau compte' : 'Modifier compte'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Numero</label>
            <input
              {...register('numero', { required: 'Numero obligatoire' })}
              disabled={modal.mode === 'edit'}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
            />
            {errors.numero && <p className="text-xs text-red-600 mt-1">{errors.numero.message}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Libelle</label>
            <input
              {...register('libelle', { required: 'Libelle obligatoire' })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
            />
            {errors.libelle && <p className="text-xs text-red-600 mt-1">{errors.libelle.message}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Type</label>
            <select {...register('type')} disabled={modal.mode === 'edit'} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100">
              {TYPES.filter((t) => t !== 'TOUS').map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Description</label>
            <textarea {...register('description')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', compte: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter la balance en PDF"
        rowsCount={comptes.length}
        onExport={async () => {
          try {
            const response = await getBalance();
            const balanceComptes = response?.data?.data?.comptes || [];

            const balanceByCompteId = new Map(
              balanceComptes
                .filter((item) => item?._id)
                .map((item) => [String(item._id), item])
            );

            const balanceByNumero = new Map(
              balanceComptes
                .filter((item) => item?.numero)
                .map((item) => [String(item.numero), item])
            );

            const balanceLike = comptes.map((c) => {
              const fromId = c?._id ? balanceByCompteId.get(String(c._id)) : null;
              const fromNumero = c?.numero ? balanceByNumero.get(String(c.numero)) : null;
              const source = fromId || fromNumero || {};

              return {
                numero: c.numero,
                libelle: c.libelle,
                type: c.type,
                totalDebit: Number(source.totalDebit || 0),
                totalCredit: Number(source.totalCredit || 0),
                solde: Number(source.solde || 0),
              };
            });

            exportBalancePDF(balanceLike);
            setIsExportOpen(false);
          } catch (error) {
            setErrorMsg(error?.response?.data?.message || 'Impossible d\'exporter la balance PDF.');
          }
        }}
      />
    </div>
  );
};

export default Comptes;
