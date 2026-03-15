import React, { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Eye, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import { createFacture, deleteFacture, getFactureById, getFactures, updateStatutFacture } from '../../services/comptaService';

const STATUS_OPTIONS = ['TOUS', 'BROUILLON', 'VALIDEE', 'PAYEE', 'ANNULEE'];

const extractFactures = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.factures)) return data.factures;
  return [];
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
};

const toInputDate = (d) => {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
};

const Factures = () => {
  const [loading, setLoading] = useState(false);
  const [factures, setFactures] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('TOUS');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, facture: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, facture: null });
  const [errorMsg, setErrorMsg] = useState('');

  const { control, register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      clientNom: '',
      clientEmail: '',
      dateEcheance: '',
      notes: '',
      lignes: [{ designation: '', quantite: 1, prixUnitaire: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' });
  const watchedLines = watch('lignes');

  const totals = useMemo(() => {
    const montantHT = (watchedLines || []).reduce((sum, l) => {
      return sum + Number(l?.quantite || 0) * Number(l?.prixUnitaire || 0);
    }, 0);
    const tva = montantHT * 0.2;
    const montantTTC = montantHT + tva;
    return { montantHT, tva, montantTTC };
  }, [watchedLines]);

  const fetchFactures = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status !== 'TOUS') params.statut = status;
      const response = await getFactures(params);
      setFactures(extractFactures(response));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Impossible de charger les factures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactures();
  }, [search, status]);

  const onCreateFacture = async (formData) => {
    const payload = {
      clientNom: formData.clientNom,
      clientEmail: formData.clientEmail || undefined,
      dateEcheance: formData.dateEcheance || undefined,
      notes: formData.notes || undefined,
      lignes: formData.lignes.map((l) => ({
        designation: l.designation,
        quantite: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
      })),
    };

    try {
      await createFacture(payload);
      setIsCreateOpen(false);
      reset();
      fetchFactures();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Creation de facture impossible.');
    }
  };

  const onDeleteFacture = async (row) => {
    if (row.statut !== 'BROUILLON') return;
    if (!window.confirm(`Supprimer la facture ${row.numero} ?`)) return;

    try {
      await deleteFacture(row._id);
      fetchFactures();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  const openStatusModal = (facture) => {
    setStatusModal({ open: true, facture });
  };

  const submitStatus = async (nextStatut) => {
    if (!statusModal.facture?._id) return;
    try {
      await updateStatutFacture(statusModal.facture._id, nextStatut);
      setStatusModal({ open: false, facture: null });
      fetchFactures();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Mise a jour du statut impossible.');
    }
  };

  const openDetails = async (row) => {
    try {
      const response = await getFactureById(row._id);
      setDetailsModal({ open: true, facture: response?.data?.data?.facture || row });
    } catch {
      setDetailsModal({ open: true, facture: row });
    }
  };

  const transitions = useMemo(() => {
    const statut = statusModal.facture?.statut;
    if (statut === 'BROUILLON') {
      return [
        { label: 'Valider', value: 'VALIDEE', className: 'bg-blue-600 hover:bg-blue-700 text-white' },
        { label: 'Annuler', value: 'ANNULEE', className: 'bg-red-600 hover:bg-red-700 text-white' },
      ];
    }
    if (statut === 'VALIDEE') {
      return [
        { label: 'Marquer Payee', value: 'PAYEE', className: 'bg-green-600 hover:bg-green-700 text-white' },
        { label: 'Annuler', value: 'ANNULEE', className: 'bg-red-600 hover:bg-red-700 text-white' },
      ];
    }
    return [];
  }, [statusModal.facture]);

  const columns = [
    { Header: 'Numero', accessor: 'numero' },
    { Header: 'Client', accessor: 'clientNom' },
    {
      Header: 'Date',
      accessor: 'date',
      Cell: ({ value }) => toInputDate(value),
    },
    {
      Header: 'Montant HT',
      accessor: 'montantHT',
      Cell: ({ value }) => formatCurrency(value),
    },
    {
      Header: 'TVA',
      accessor: 'tva',
      Cell: ({ value }) => formatCurrency(value),
    },
    {
      Header: 'Montant TTC',
      accessor: 'montantTTC',
      Cell: ({ value }) => formatCurrency(value),
    },
    {
      Header: 'Statut',
      accessor: 'statut',
      Cell: ({ value }) => <Badge status={value} />,
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ value, row }) => value,
    },
  ];

  const tableData = factures.map((f) => ({
    ...f,
    actions: (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openDetails(f)}
          className="text-gray-700 hover:text-black"
          title="Voir detail"
        >
          <Eye size={18} />
        </button>
        {(f.statut === 'BROUILLON' || f.statut === 'VALIDEE') && (
          <button
            onClick={() => openStatusModal(f)}
            className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
            title="Changer statut"
          >
            Statut
          </button>
        )}
        {f.statut === 'BROUILLON' && (
          <button
            onClick={() => onDeleteFacture(f)}
            className="text-red-600 hover:text-red-800"
            title="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Factures</h2>
            <p className="text-sm text-gray-500">Suivi des factures clients et cycle de statut.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchFactures}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              title="Actualiser"
            >
              <RefreshCcw size={16} />
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2"
            >
              <Plus size={16} /> Nouvelle Facture
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <SearchBar
            placeholder="Rechercher par numero ou client"
            onSearch={setSearch}
            value={search}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'TOUS' ? 'Tous' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={tableData} loading={loading} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nouvelle Facture" size="lg">
        <form onSubmit={handleSubmit(onCreateFacture)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Nom client</label>
              <input
                {...register('clientNom', { required: 'Le nom client est requis' })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
              />
              {errors.clientNom && <p className="text-xs text-red-600 mt-1">{errors.clientNom.message}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600">Email client (optionnel)</label>
              <input
                type="email"
                {...register('clientEmail')}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Date echeance</label>
              <input
                type="date"
                {...register('dateEcheance')}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Notes</label>
              <input
                {...register('notes')}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Lignes de facture</h3>
              <button
                type="button"
                onClick={() => append({ designation: '', quantite: 1, prixUnitaire: 0 })}
                className="text-sm px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                + Ajouter une ligne
              </button>
            </div>

            {fields.map((field, index) => {
              const qty = Number(watchedLines?.[index]?.quantite || 0);
              const price = Number(watchedLines?.[index]?.prixUnitaire || 0);
              const lineTotal = qty * price;

              return (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                  <div className="md:col-span-5">
                    <label className="text-xs text-gray-500">Designation</label>
                    <input
                      {...register(`lignes.${index}.designation`, { required: true })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500">Quantite</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      {...register(`lignes.${index}.quantite`, { required: true, min: 1 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500">Prix unitaire</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`lignes.${index}.prixUnitaire`, { required: true, min: 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2 text-sm font-semibold text-gray-700">
                    {formatCurrency(lineTotal)}
                  </div>
                  <div className="md:col-span-1">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>HT</span><strong>{formatCurrency(totals.montantHT)}</strong></div>
            <div className="flex justify-between"><span>TVA (20%)</span><strong>{formatCurrency(totals.tva)}</strong></div>
            <div className="flex justify-between text-base"><span>TTC</span><strong>{formatCurrency(totals.montantTTC)}</strong></div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, facture: null })}
        title="Changer le statut"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Facture <strong>{statusModal.facture?.numero}</strong> - statut actuel:{' '}
            <Badge status={statusModal.facture?.statut || ''} />
          </p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.value}
                onClick={() => submitStatus(t.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${t.className}`}
              >
                {t.label}
              </button>
            ))}
            {transitions.length === 0 && <p className="text-sm text-gray-500">Aucune transition disponible.</p>}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, facture: null })}
        title="Detail facture"
        size="lg"
      >
        {detailsModal.facture && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><span className="text-gray-500">Numero</span><p className="font-semibold">{detailsModal.facture.numero}</p></div>
              <div><span className="text-gray-500">Client</span><p className="font-semibold">{detailsModal.facture.clientNom}</p></div>
              <div><span className="text-gray-500">Statut</span><p><Badge status={detailsModal.facture.statut} /></p></div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Designation</th>
                    <th className="text-left px-3 py-2">Quantite</th>
                    <th className="text-left px-3 py-2">Prix</th>
                    <th className="text-left px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailsModal.facture.lignes || []).map((l, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{l.designation}</td>
                      <td className="px-3 py-2">{l.quantite}</td>
                      <td className="px-3 py-2">{formatCurrency(l.prixUnitaire)}</td>
                      <td className="px-3 py-2">{formatCurrency(Number(l.quantite) * Number(l.prixUnitaire))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Factures;
