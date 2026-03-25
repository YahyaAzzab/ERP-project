import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Users, UserCheck, Wallet, FileText, Eye, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import ExportModal from '../../components/common/ExportModal';
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  getStatistiquesClients,
  updateClient,
} from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { exportComptesClientsPDF } from '../../utils/exportPDF';

const STATUTS = ['TOUS', 'ACTIF', 'INACTIF'];

const formatCurrency = (value) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(value || 0));
const toDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '-');

const extractArrayData = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.clients)) return data.clients;
  return [];
};

const Clients = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalClientsActifs: 0, caTotal: 0 });
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('TOUS');
  const [secteur, setSecteur] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [editModal, setEditModal] = useState({ open: false, mode: 'create', client: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, client: null });
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      pays: 'Maroc',
      secteurActivite: '',
      notes: '',
      statut: 'ACTIF',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statut !== 'TOUS') params.statut = statut;

      const [clientsRes, statsRes] = await Promise.all([
        getClients(params),
        getStatistiquesClients(),
      ]);

      setClients(extractArrayData(clientsRes));
      setStats(statsRes?.data?.data || { totalClientsActifs: 0, caTotal: 0 });
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des clients impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statut]);

  useEffect(() => {
    if (!clientId) return;
    openDetails({ _id: clientId });
  }, [clientId]);

  const secteurs = useMemo(() => {
    const set = new Set(clients.map((c) => c.secteurActivite).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!secteur) return clients;
    return clients.filter((c) => c.secteurActivite === secteur);
  }, [clients, secteur]);

  const openCreate = () => {
    reset({
      nom: '', email: '', telephone: '', adresse: '', ville: '', pays: 'Maroc',
      secteurActivite: '', notes: '', statut: 'ACTIF',
    });
    setEditModal({ open: true, mode: 'create', client: null });
  };

  const openEdit = (client) => {
    reset({
      nom: client.nom || '',
      email: client.email || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      ville: client.ville || '',
      pays: client.pays || 'Maroc',
      secteurActivite: client.secteurActivite || '',
      notes: client.notes || '',
      statut: client.statut || 'ACTIF',
    });
    setEditModal({ open: true, mode: 'edit', client });
  };

  const onSubmit = async (values) => {
    try {
      if (editModal.mode === 'create') {
        await createClient(values);
      } else {
        await updateClient(editModal.client._id, values);
      }
      setEditModal({ open: false, mode: 'create', client: null });
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Enregistrement client impossible.');
    }
  };

  const openDetails = async (row) => {
    try {
      const response = await getClientById(row._id);
      setDetailsModal({ open: true, client: response?.data?.data || row });
    } catch {
      setDetailsModal({ open: true, client: row });
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Supprimer ${row.nom} ?`)) return;
    try {
      await deleteClient(row._id);
      fetchData();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Suppression client impossible.');
    }
  };

  const columns = [
    { Header: 'Nom', accessor: 'nom' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Telephone', accessor: 'telephone' },
    { Header: 'Ville', accessor: 'ville' },
    { Header: 'Secteur', accessor: 'secteurActivite' },
    { Header: 'Nb Factures', accessor: 'nombreFactures' },
    { Header: 'CA Total', accessor: 'chiffreAffaires', Cell: ({ value }) => formatCurrency(value) },
    { Header: 'Statut', accessor: 'statut', Cell: ({ value }) => <Badge status={value} /> },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ value }) => value,
    },
  ];

  const rows = filteredClients.map((c) => ({
    ...c,
    actions: (
      <div className="flex items-center gap-2">
        <button
          title="Voir detail"
          onClick={() => navigate(`/clients/${c._id}`)}
          className="p-1 text-gray-700 hover:text-black hover:scale-110 transition"
        >
          <Eye size={18} />
        </button>
        {hasRole('ADMIN') && (
          <>
            <button
              title="Modifier"
              onClick={() => openEdit(c)}
              className="p-1 text-blue-600 hover:text-blue-800 hover:scale-110 transition"
            >
              <Pencil size={18} />
            </button>
            <button
              title="Supprimer"
              onClick={() => onDelete(c)}
              className="p-1 text-red-600 hover:text-red-800 hover:scale-110 transition"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard title="Total clients" value={rows.length} icon={<Users className="text-white" size={20} />} color="bg-blue-500" />
        <StatCard title="Clients actifs" value={stats.totalClientsActifs || rows.filter((c) => c.statut === 'ACTIF').length} icon={<UserCheck className="text-white" size={20} />} color="bg-green-500" />
        <StatCard title="CA total genere" value={formatCurrency(stats.caTotal || rows.reduce((s, c) => s + Number(c.chiffreAffaires || 0), 0))} icon={<Wallet className="text-white" size={20} />} color="bg-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Clients</h2>
          {hasRole('ADMIN') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm"
              >
                <FileText size={16} /> Exporter PDF
              </button>
              <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">+ Nouveau Client</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchBar placeholder="Rechercher nom, email, ville" value={search} onSearch={setSearch} />
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            {STATUTS.map((s) => <option key={s} value={s}>{s === 'TOUS' ? 'Tous statuts' : s}</option>)}
          </select>
          <select value={secteur} onChange={(e) => setSecteur(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
            <option value="">Tous secteurs</option>
            {secteurs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, mode: 'create', client: null })}
        title={editModal.mode === 'create' ? 'Nouveau client' : 'Modifier client'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <label className="text-sm text-gray-600">Adresse</label>
            <input {...register('adresse')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Ville</label>
            <input {...register('ville')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Pays</label>
            <input {...register('pays')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Secteur d'activite</label>
            <input {...register('secteurActivite')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Statut</label>
            <select {...register('statut')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300">
              <option value="ACTIF">ACTIF</option>
              <option value="INACTIF">INACTIF</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Notes</label>
            <textarea rows={3} {...register('notes')} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditModal({ open: false, mode: 'create', client: null })} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailsModal.open}
        onClose={() => {
          setDetailsModal({ open: false, client: null });
          if (clientId) navigate('/clients');
        }}
        title="Detail client"
        size="xl"
      >
        {detailsModal.client && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><span className="text-gray-500">Nom:</span> <strong>{detailsModal.client.nom}</strong></p>
              <p><span className="text-gray-500">Email:</span> {detailsModal.client.email || '-'}</p>
              <p><span className="text-gray-500">Telephone:</span> {detailsModal.client.telephone || '-'}</p>
              <p><span className="text-gray-500">Ville:</span> {detailsModal.client.ville || '-'}</p>
              <p><span className="text-gray-500">Secteur:</span> {detailsModal.client.secteurActivite || '-'}</p>
              <p><span className="text-gray-500">Statut:</span> <Badge status={detailsModal.client.statut || 'ACTIF'} /></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Nombre de factures</p>
                <p className="font-semibold">{detailsModal.client.kpis?.nombreFactures ?? detailsModal.client.nombreFactures ?? 0}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-500 text-xs">CA total (PAYEE)</p>
                <p className="font-semibold">{formatCurrency(detailsModal.client.kpis?.chiffreAffaires ?? detailsModal.client.chiffreAffaires)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Facture plus recente</p>
                <p className="font-semibold">{detailsModal.client.kpis?.facturePlusRecente?.numero || '-'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Montant moyen / facture</p>
                <p className="font-semibold">{formatCurrency(detailsModal.client.kpis?.montantMoyenFacture || 0)}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Factures associees</p>
              {(detailsModal.client.facturesAssociees || []).length === 0 ? (
                <p className="text-gray-500">Aucune facture liee.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2">Numero</th>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-left px-3 py-2">Montant TTC</th>
                        <th className="text-left px-3 py-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsModal.client.facturesAssociees.map((f) => (
                        <tr key={f._id} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <Link to={`/comptabilite/factures/${f._id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                              {f.numero}
                            </Link>
                          </td>
                          <td className="px-3 py-2">{toDate(f.date)}</td>
                          <td className="px-3 py-2">{formatCurrency(f.montantTTC)}</td>
                          <td className="px-3 py-2"><Badge status={f.statut} /></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="px-3 py-2 font-semibold" colSpan={2}>Total</td>
                        <td className="px-3 py-2 font-semibold" colSpan={2}>
                          {formatCurrency(detailsModal.client.facturesAssociees.reduce((acc, f) => acc + Number(f.montantTTC || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Exporter les clients en PDF"
        rowsCount={rows.length}
        columns={[
          { key: 'nom', label: 'Nom', defaultChecked: true },
          { key: 'email', label: 'Email', defaultChecked: true },
          { key: 'telephone', label: 'Telephone', defaultChecked: true },
          { key: 'ville', label: 'Ville', defaultChecked: true },
          { key: 'chiffreAffaires', label: 'CA', defaultChecked: true },
          { key: 'nombreFactures', label: 'Nb Factures', defaultChecked: true },
        ]}
        onExport={({ selectedColumns }) => {
          exportComptesClientsPDF(rows, { columns: selectedColumns });
          setIsExportOpen(false);
        }}
      />
    </div>
  );
};

export default Clients;
