import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, MailPlus, Send, MailOpen } from 'lucide-react';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import {
  envoyerMessage,
  getDestinataires,
  getEnvoyes,
  getMessageById,
  getReception,
  marquerCommeLu,
} from '../../services/messageService';

const extractMessages = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
};

const extractRecipients = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  return [];
};

const toDateTime = (value) => (value ? new Date(value).toLocaleString('fr-FR') : '-');

const Messages = () => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('reception');
  const [messages, setMessages] = useState([]);
  const [destinataires, setDestinataires] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, message: null });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      destinataireId: '',
      sujet: '',
      contenu: '',
    },
  });

  const fetchDestinataires = async () => {
    try {
      const response = await getDestinataires();
      setDestinataires(extractRecipients(response));
    } catch {
      setDestinataires([]);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();

      if (activeTab === 'reception') {
        const response = await getReception(params);
        setMessages(extractMessages(response));
        setUnreadCount(Number(response?.data?.data?.unreadCount || 0));
      } else {
        const response = await getEnvoyes(params);
        setMessages(extractMessages(response));
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Chargement des messages impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinataires();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [activeTab, search]);

  const openCompose = () => {
    setSuccessMsg('');
    reset({ destinataireId: '', sujet: '', contenu: '' });
    setComposeOpen(true);
  };

  const onSendMessage = async (values) => {
    try {
      await envoyerMessage(values);
      setComposeOpen(false);
      setSuccessMsg('Message envoye avec succes.');
      if (activeTab === 'envoyes') {
        fetchMessages();
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Envoi du message impossible.');
    }
  };

  const onOpenMessage = async (row) => {
    try {
      const response = await getMessageById(row._id);
      const msg = response?.data?.data?.message || row;
      setDetailModal({ open: true, message: msg });
      if (activeTab === 'reception' && !msg.lu) {
        await marquerCommeLu(msg._id);
        fetchMessages();
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Lecture du message impossible.');
    }
  };

  const columns = useMemo(() => {
    const senderOrRecipient = activeTab === 'reception'
      ? {
        Header: 'Expediteur',
        accessor: 'counterparty',
      }
      : {
        Header: 'Destinataire',
        accessor: 'counterparty',
      };

    return [
      senderOrRecipient,
      { Header: 'Sujet', accessor: 'sujet' },
      { Header: 'Date', accessor: 'date' },
      ...(activeTab === 'reception' ? [{ Header: 'Statut', accessor: 'statut', Cell: ({ value }) => <Badge status={value} /> }] : []),
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ value }) => value,
      },
    ];
  }, [activeTab]);

  const rows = useMemo(() => messages.map((m) => {
    const counterparty = activeTab === 'reception'
      ? `${m.expediteur?.prenom || ''} ${m.expediteur?.nom || ''}`.trim() || m.expediteur?.email || '-'
      : `${m.destinataire?.prenom || ''} ${m.destinataire?.nom || ''}`.trim() || m.destinataire?.email || '-';

    return {
      ...m,
      counterparty,
      date: toDateTime(m.createdAt),
      statut: m.lu ? 'ACTIF' : 'EN_ATTENTE',
      actions: (
        <button
          onClick={() => onOpenMessage(m)}
          className="p-1 text-gray-700 hover:text-black hover:scale-110 transition"
          title="Lire"
        >
          <Eye size={18} />
        </button>
      ),
    };
  }), [messages, activeTab]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Messagerie interne</h2>
            <p className="text-sm text-gray-500">Echangez des messages entre utilisateurs de la plateforme.</p>
          </div>
          <button
            onClick={openCompose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2"
          >
            <MailPlus size={16} /> Nouveau message
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reception')}
              className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
                activeTab === 'reception' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <MailOpen size={16} /> Reception ({unreadCount} non lus)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('envoyes')}
              className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
                activeTab === 'envoyes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <Send size={16} /> Envoyes
            </button>
          </div>
          <SearchBar placeholder="Rechercher sujet ou contenu" value={search} onSearch={setSearch} />
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">{successMsg}</div>}

      <DataTable columns={columns} data={rows} loading={loading} />

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Nouveau message" size="lg">
        <form onSubmit={handleSubmit(onSendMessage)} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Destinataire</label>
            <select
              {...register('destinataireId', { required: 'Selectionnez un destinataire' })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
            >
              <option value="">Choisir un utilisateur</option>
              {destinataires.map((u) => (
                <option key={u._id} value={u._id}>{u.prenom} {u.nom} - {u.role}</option>
              ))}
            </select>
            {errors.destinataireId && <p className="text-xs text-red-600 mt-1">{errors.destinataireId.message}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Sujet</label>
            <input
              {...register('sujet', { required: 'Sujet requis' })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
            />
            {errors.sujet && <p className="text-xs text-red-600 mt-1">{errors.sujet.message}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Message</label>
            <textarea
              rows={6}
              {...register('contenu', { required: 'Message requis' })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"
            />
            {errors.contenu && <p className="text-xs text-red-600 mt-1">{errors.contenu.message}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setComposeOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModal.open} onClose={() => setDetailModal({ open: false, message: null })} title="Detail message" size="lg">
        {detailModal.message && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p>
                <span className="text-gray-500">Expediteur:</span>{' '}
                <strong>{detailModal.message.expediteur?.prenom} {detailModal.message.expediteur?.nom}</strong>
              </p>
              <p>
                <span className="text-gray-500">Destinataire:</span>{' '}
                <strong>{detailModal.message.destinataire?.prenom} {detailModal.message.destinataire?.nom}</strong>
              </p>
              <p><span className="text-gray-500">Date:</span> {toDateTime(detailModal.message.createdAt)}</p>
              <p><span className="text-gray-500">Statut:</span> <Badge status={detailModal.message.lu ? 'ACTIF' : 'EN_ATTENTE'} /></p>
            </div>

            <div>
              <p className="text-gray-500">Sujet</p>
              <p className="font-semibold">{detailModal.message.sujet}</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 whitespace-pre-wrap leading-relaxed">
              {detailModal.message.contenu}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;
