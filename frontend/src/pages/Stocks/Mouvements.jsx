import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ExportModal from '../../components/common/ExportModal';
import Badge from '../../components/common/Badge';
import {
  ajustementStock,
  entreeStock,
  getMouvements,
  getProduits,
  sortieStock,
} from '../../services/stocksService';
import { useAuth } from '../../context/AuthContext';
import { exportMouvementsPDF } from '../../utils/exportPDF';

const parseList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.mouvements)) return data.mouvements;
  if (Array.isArray(data?.produits)) return data.produits;
  return [];
};

const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '-');

const Mouvements = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mouvements, setMouvements] = useState([]);
  const [produits, setProduits] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [modal, setModal] = useState({ open: false, type: null });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedProduitStock, setSelectedProduitStock] = useState(0);

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      produitId: '',
      quantite: 1,
      nouvelleQuantite: 0,
      motif: '',
      reference: '',
    },
  });

  const watchedProduitId = watch('produitId');
  const watchedNouvelleQuantite = Number(watch('nouvelleQuantite') || 0);

  useEffect(() => {
    const p = produits.find((x) => x._id === watchedProduitId);
    setSelectedProduitStock(Number(p?.quantiteStock || 0));
  }, [watchedProduitId, produits]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (dateFilter) {
        params.dateDebut = dateFilter;
        params.dateFin = dateFilter;
      }

      const [mouvRes, prodRes] = await Promise.all([
        getMouvements(params),
        getProduits({ actif: true, limit: 200 }),
      ]);

      setMouvements(parseList(mouvRes));
      setProduits(parseList(prodRes));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des mouvements impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, dateFilter]);

  const openModal = (type) => {
    reset({ produitId: '', quantite: 1, nouvelleQuantite: 0, motif: '', reference: '' });
    setSelectedProduitStock(0);
    setModal({ open: true, type });
  };

  const onSubmit = async (values) => {
    try {
      if (modal.type === 'ENTREE') {
        await entreeStock({
          produitId: values.produitId,
          quantite: Number(values.quantite),
          motif: values.motif,
          reference: values.reference || undefined,
        });
      } else if (modal.type === 'SORTIE') {
        if (Number(values.quantite) > selectedProduitStock) {
          setErrorMsg('Quantite de sortie superieure au stock disponible.');
          return;
        }
        await sortieStock({
          produitId: values.produitId,
          quantite: Number(values.quantite),
          motif: values.motif,
          reference: values.reference || undefined,
        });
      } else if (modal.type === 'AJUSTEMENT') {
        await ajustementStock({
          produitId: values.produitId,
          nouvelleQuantite: Number(values.nouvelleQuantite),
          motif: values.motif,
        });
      }

      setModal({ open: false, type: null });
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Operation stock impossible.');
    }
  };

  const columns = useMemo(() => [
    { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDate(value) },
    { Header: 'Produit', accessor: 'produitLabel' },
    { Header: 'Type', accessor: 'type', Cell: ({ value }) => <Badge status={value} /> },
    { Header: 'Qte avant', accessor: 'qteAvant' },
    { Header: 'Qte mouvement', accessor: 'quantite' },
    { Header: 'Qte apres', accessor: 'qteApres' },
    { Header: 'Motif', accessor: 'motif' },
    { Header: 'Par', accessor: 'par' },
  ], []);

  const rows = mouvements.map((m) => ({
    ...m,
    produitLabel: `${m.produit?.reference || ''} ${m.produit?.designation || ''}`.trim(),
    qteAvant: m.quantiteAvant ?? m.stockAvant ?? '-',
    qteApres: m.quantiteApres ?? m.stockApres ?? '-',
    par: `${m.effectuePar?.prenom || ''} ${m.effectuePar?.nom || ''}`.trim() || '-',
  }));

  const diff = watchedNouvelleQuantite - selectedProduitStock;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {hasRole('ADMIN', 'MAGASINIER') && (
            <button onClick={() => setIsExportOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-sm"><FileText size={16} /> Exporter PDF</button>
          )}
          <button onClick={() => openModal('ENTREE')} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm">Entree</button>
          <button onClick={() => openModal('SORTIE')} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">Sortie</button>
          <button onClick={() => openModal('AJUSTEMENT')} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm">Ajustement</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            <option value="">Tous les types</option>
            <option value="ENTREE">ENTREE</option>
            <option value="SORTIE">SORTIE</option>
            <option value="AJUSTEMENT">AJUSTEMENT</option>
          </select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300" />
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, type: null })} title={modal.type ? `Mouvement: ${modal.type}` : 'Mouvement'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Produit</label>
            <select {...register('produitId', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              <option value="">Selectionner</option>
              {produits.map((p) => <option key={p._id} value={p._id}>{p.reference} - {p.designation}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Stock actuel: {selectedProduitStock}</p>
          </div>

          {modal.type === 'AJUSTEMENT' ? (
            <div>
              <label className="text-sm text-gray-600">Nouvelle quantite</label>
              <input type="number" min="0" {...register('nouvelleQuantite', { required: true, min: 0 })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
              <p className="text-xs text-gray-500 mt-1">
                Stock actuel: {selectedProduitStock} {'->'} Nouveau: {watchedNouvelleQuantite} ({diff >= 0 ? '+' : ''}{diff})
              </p>
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-600">Quantite</label>
              <input type="number" min="1" {...register('quantite', { required: true, min: 1 })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
              {modal.type === 'SORTIE' && selectedProduitStock <= 5 && (
                <p className="text-xs text-amber-700 mt-1">Attention: stock proche du seuil.</p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600">Motif</label>
            <input {...register('motif', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>

          {modal.type !== 'AJUSTEMENT' && (
            <div>
              <label className="text-sm text-gray-600">Reference BL / Doc</label>
              <input {...register('reference')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, type: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement...' : 'Valider'}</button>
          </div>
        </form>
      </Modal>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter les mouvements en PDF"
        rowsCount={rows.length}
        onExport={({ dateDebut, dateFin }) => {
          exportMouvementsPDF(mouvements, { type: typeFilter, dateDebut, dateFin });
          setIsExportOpen(false);
        }}
      />
    </div>
  );
};

export default Mouvements;
