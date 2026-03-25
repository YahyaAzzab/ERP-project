import React, { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, Wallet, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import StatCard from '../../components/common/StatCard';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ExportModal from '../../components/common/ExportModal';
import {
  createProduit,
  deleteProduit,
  getCategories,
  getFournisseurs,
  getProduits,
  updateProduit,
} from '../../services/stocksService';
import { useAuth } from '../../context/AuthContext';
import { exportProduitsPDF } from '../../utils/exportPDF';

const UNITES = ['unite', 'kg', 'litre', 'metre', 'boite'];

const parseList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.produits)) return data.produits;
  return [];
};

const formatCurrency = (value) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(value || 0));

const getStockColor = (quantite, seuil) => {
  const q = Number(quantite || 0);
  const s = Number(seuil || 0);
  if (q === 0) return 'text-red-700 font-bold';
  if (q <= s) return 'text-red-600 font-semibold';
  if (q <= s * 1.25) return 'text-orange-500';
  if (q <= s * 1.5) return 'text-yellow-500';
  if (q <= s * 2) return 'text-lime-500';
  return 'text-green-600 font-medium';
};

const Produits = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [alerte, setAlerte] = useState('TOUS');
  const [modal, setModal] = useState({ open: false, mode: 'create', produit: null });
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      designation: '',
      categorie: '',
      unite: 'unite',
      prixUnitaire: 0,
      prixAchat: 0,
      seuilAlerte: 5,
      fournisseur: '',
      description: '',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categorie) params.categorie = categorie;
      if (alerte === 'OUI') params.enAlerte = true;

      const [prodRes, catRes, fourRes] = await Promise.all([
        getProduits(params),
        getCategories(),
        getFournisseurs({ actif: true, limit: 100 }),
      ]);

      setProduits(parseList(prodRes));
      setCategories(Array.isArray(catRes?.data?.data) ? catRes.data.data : []);
      setFournisseurs(parseList(fourRes));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des produits impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categorie, alerte]);

  const stats = useMemo(() => {
    const total = produits.length;
    const enAlerte = produits.filter((p) => Number(p.quantiteStock || 0) <= Number(p.seuilAlerte || 0)).length;
    const valeur = produits.reduce((sum, p) => sum + Number(p.quantiteStock || 0) * Number(p.prixUnitaire || 0), 0);
    return { total, enAlerte, valeur };
  }, [produits]);

  const openCreate = () => {
    reset({ designation: '', categorie: '', unite: 'unite', prixUnitaire: 0, prixAchat: 0, seuilAlerte: 5, fournisseur: '', description: '' });
    setModal({ open: true, mode: 'create', produit: null });
  };

  const openEdit = (produit) => {
    reset({
      designation: produit.designation || '',
      categorie: produit.categorie || '',
      unite: produit.unite || 'unite',
      prixUnitaire: produit.prixUnitaire || 0,
      prixAchat: produit.prixAchat || 0,
      seuilAlerte: produit.seuilAlerte || 5,
      fournisseur: produit.fournisseur?._id || produit.fournisseur || '',
      description: produit.description || '',
    });
    setModal({ open: true, mode: 'edit', produit });
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      prixUnitaire: Number(values.prixUnitaire),
      prixAchat: Number(values.prixAchat || 0),
      seuilAlerte: Number(values.seuilAlerte || 0),
      fournisseur: values.fournisseur || undefined,
    };

    try {
      if (modal.mode === 'create') {
        await createProduit(payload);
      } else {
        await updateProduit(modal.produit._id, payload);
      }
      setModal({ open: false, mode: 'create', produit: null });
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Enregistrement produit impossible.');
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Supprimer ${row.designation} ?`)) return;
    try {
      await deleteProduit(row._id);
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Suppression produit impossible.');
    }
  };

  const columns = [
    { Header: 'Reference', accessor: 'reference' },
    { Header: 'Designation', accessor: 'designation' },
    { Header: 'Categorie', accessor: 'categorie' },
    {
      Header: 'Stock',
      accessor: 'stockDisplay',
      Cell: ({ value }) => {
        if (value.quantite === 0) {
          return <span className={`inline-flex items-center gap-1 ${value.className}`}><AlertTriangle size={14} /> Rupture</span>;
        }
        return <span className={value.className}>{value.quantite} {value.unite}</span>;
      },
    },
    { Header: 'Seuil', accessor: 'seuilAlerte' },
    { Header: 'Prix', accessor: 'prixUnitaire', Cell: ({ value }) => formatCurrency(value) },
  ];

  const rows = produits.map((p) => ({
    ...p,
    alerte: Number(p.quantiteStock || 0) <= Number(p.seuilAlerte || 0),
    stockDisplay: {
      quantite: Number(p.quantiteStock || 0),
      unite: p.unite || '',
      className: getStockColor(p.quantiteStock, p.seuilAlerte),
    },
  }));

  const filteredRows = rows.filter((r) => {
    if (alerte === 'OUI') return r.alerte;
    if (alerte === 'OK') return !r.alerte;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard title="Total produits" value={stats.total} icon={<Package className="text-white" size={20} />} color="bg-blue-500" />
        <StatCard title="Produits en alerte" value={stats.enAlerte} icon={<AlertTriangle className="text-white" size={20} />} color="bg-red-500" />
        <StatCard title="Valeur stock" value={formatCurrency(stats.valeur)} icon={<Wallet className="text-white" size={20} />} color="bg-emerald-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Produits</h2>
          <div className="flex items-center gap-2">
            {hasRole('ADMIN', 'MAGASINIER') && (
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm"
              >
                <FileText size={16} /> Exporter PDF
              </button>
            )}
            <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">+ Nouveau Produit</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchBar placeholder="Rechercher reference ou designation" value={search} onSearch={setSearch} />
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            <option value="">Toutes categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={alerte} onChange={(e) => setAlerte(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            <option value="TOUS">Tous</option>
            <option value="OUI">En alerte</option>
            <option value="OK">OK</option>
          </select>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={filteredRows} loading={loading} onEdit={openEdit} onDelete={onDelete} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', produit: null })} title={modal.mode === 'create' ? 'Nouveau produit' : 'Modifier produit'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Designation</label>
            <input {...register('designation', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Categorie</label>
            <input {...register('categorie', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Unite</label>
            <select {...register('unite')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Prix unitaire</label>
            <input type="number" step="0.01" min="0" {...register('prixUnitaire', { required: true })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Prix achat</label>
            <input type="number" step="0.01" min="0" {...register('prixAchat')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Seuil alerte</label>
            <input type="number" step="1" min="0" {...register('seuilAlerte')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Fournisseur</label>
            <select {...register('fournisseur')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              <option value="">Aucun fournisseur</option>
              {fournisseurs.map((f) => <option key={f._id} value={f._id}>{f.nom}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Description</label>
            <textarea rows={3} {...register('description')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', produit: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter les produits en PDF"
        rowsCount={filteredRows.length}
        options={[
          { key: 'alertOnly', label: 'Afficher uniquement produits en alerte', defaultChecked: alerte === 'OUI' },
          { key: 'includeValorisation', label: 'Inclure valorisation du stock', defaultChecked: true },
        ]}
        onExport={({ selectedOptions, dateDebut, dateFin }) => {
          exportProduitsPDF(filteredRows, { search, categorie, dateDebut, dateFin }, {
            alertOnly: selectedOptions.includes('alertOnly'),
            includeValorisation: selectedOptions.includes('includeValorisation'),
          });
          setIsExportOpen(false);
        }}
      />
    </div>
  );
};

export default Produits;
