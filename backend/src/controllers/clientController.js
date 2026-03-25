const mongoose = require('mongoose');
const Client = require('../models/Client');
const Facture = require('../models/Facture');
const apiResponse = require('../utils/apiResponse');

const STATUTS_CA = ['VALIDEE', 'PAYEE'];

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '10', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const hydrateClientStats = async (clientId) => {
  const [count, caAgg] = await Promise.all([
    Facture.countDocuments({ client: clientId }),
    Facture.aggregate([
      { $match: { client: new mongoose.Types.ObjectId(clientId), statut: { $in: STATUTS_CA } } },
      { $group: { _id: null, total: { $sum: '$montantTTC' } } },
    ]),
  ]);

  const chiffreAffaires = caAgg?.[0]?.total || 0;
  return { chiffreAffaires, nombreFactures: count };
};

const recalculerStatsClient = async (clientId) => {
  if (!mongoose.isValidObjectId(clientId)) return null;

  const stats = await Facture.aggregate([
    { $match: { client: new mongoose.Types.ObjectId(clientId) } },
    {
      $group: {
        _id: '$statut',
        total: { $sum: '$montantTTC' },
        count: { $sum: 1 },
      },
    },
  ]);

  const caTotal = stats
    .filter((s) => STATUTS_CA.includes(s._id))
    .reduce((acc, s) => acc + Number(s.total || 0), 0);

  const nbFactures = stats
    .reduce((acc, s) => acc + Number(s.count || 0), 0);

  await Client.findByIdAndUpdate(clientId, {
    chiffreAffaires: caTotal,
    nombreFactures: nbFactures,
  });

  return { chiffreAffaires: caTotal, nombreFactures: nbFactures };
};

exports.getClients = async (req, res) => {
  try {
    const { search, statut } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const query = {};
    if (search?.trim()) {
      query.$or = [
        { nom: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { ville: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (statut && ['ACTIF', 'INACTIF'].includes(statut)) {
      query.statut = statut;
    }

    const [clients, total] = await Promise.all([
      Client.find(query)
        .populate('creePar', 'nom prenom email role')
        .sort({ nom: 1 })
        .skip(skip)
        .limit(limit),
      Client.countDocuments(query),
    ]);

    const hydrated = await Promise.all(
      clients.map(async (c) => {
        const stats = await hydrateClientStats(c._id);
        if (c.chiffreAffaires !== stats.chiffreAffaires || c.nombreFactures !== stats.nombreFactures) {
          c.chiffreAffaires = stats.chiffreAffaires;
          c.nombreFactures = stats.nombreFactures;
          await c.save();
        }
        return c;
      })
    );

    return apiResponse.paginate(res, hydrated, total, page, limit, 'Clients recuperes avec succes');
  } catch (err) {
    return apiResponse.error(res, 'Erreur lors de la recuperation des clients', 500, err.message);
  }
};

exports.getClientById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return apiResponse.error(res, 'ID client invalide', 400);
    }

    const client = await Client.findById(req.params.id).populate('creePar', 'nom prenom email role');
    if (!client) return apiResponse.error(res, 'Client introuvable', 404);

    const [facturesAssociees, stats] = await Promise.all([
      Facture.find({ client: client._id })
        .sort({ date: -1, createdAt: -1 })
        .select('numero date montantTTC statut')
        .lean(),
      hydrateClientStats(client._id),
    ]);

    const facturePlusRecente = facturesAssociees.length > 0 ? facturesAssociees[0] : null;
    const montantMoyenFacture = stats.nombreFactures > 0
      ? stats.chiffreAffaires / stats.nombreFactures
      : 0;

    const clientObj = client.toObject();
    clientObj.chiffreAffaires = stats.chiffreAffaires;
    clientObj.nombreFactures = stats.nombreFactures;
    clientObj.facturesAssociees = facturesAssociees;
    clientObj.kpis = {
      nombreFactures: stats.nombreFactures,
      chiffreAffaires: stats.chiffreAffaires,
      facturePlusRecente,
      montantMoyenFacture,
    };

    return apiResponse.success(res, clientObj, 'Client recupere avec succes');
  } catch (err) {
    return apiResponse.error(res, 'Erreur lors de la recuperation du client', 500, err.message);
  }
};

exports.createClient = async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom?.trim()) return apiResponse.error(res, 'Le champ nom est obligatoire', 400);

    const payload = {
      ...req.body,
      nom: nom.trim(),
      creePar: req.user._id,
    };

    const client = await Client.create(payload);
    return apiResponse.created(res, client, 'Client cree avec succes');
  } catch (err) {
    if (err.code === 11000) {
      return apiResponse.error(res, 'Cet email client existe deja', 409);
    }
    return apiResponse.error(res, 'Erreur lors de la creation du client', 500, err.message);
  }
};

exports.updateClient = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return apiResponse.error(res, 'ID client invalide', 400);
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.creePar;

    const client = await Client.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!client) return apiResponse.error(res, 'Client introuvable', 404);

    return apiResponse.success(res, client, 'Client mis a jour avec succes');
  } catch (err) {
    if (err.code === 11000) {
      return apiResponse.error(res, 'Cet email client existe deja', 409);
    }
    return apiResponse.error(res, 'Erreur lors de la mise a jour du client', 500, err.message);
  }
};

exports.deleteClient = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return apiResponse.error(res, 'ID client invalide', 400);
    }

    const client = await Client.findById(req.params.id);
    if (!client) return apiResponse.error(res, 'Client introuvable', 404);

    const hasFacture = await Facture.exists({ client: client._id });
    if (hasFacture) {
      return apiResponse.error(res, 'Impossible de supprimer : ce client a des factures associées', 400);
    }

    await Client.findByIdAndDelete(req.params.id);
    return apiResponse.success(res, null, 'Client supprime avec succes');
  } catch (err) {
    return apiResponse.error(res, 'Erreur lors de la suppression du client', 500, err.message);
  }
};

exports.getStatistiquesClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ nom: 1 });

    const withStats = await Promise.all(
      clients.map(async (c) => {
        const stats = await hydrateClientStats(c._id);
        return {
          ...c.toObject(),
          chiffreAffaires: stats.chiffreAffaires,
          nombreFactures: stats.nombreFactures,
        };
      })
    );

    const totalClientsActifs = withStats.filter((c) => c.statut === 'ACTIF').length;
    const caTotal = withStats.reduce((sum, c) => sum + Number(c.chiffreAffaires || 0), 0);

    const top5Clients = [...withStats]
      .sort((a, b) => Number(b.chiffreAffaires || 0) - Number(a.chiffreAffaires || 0))
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        nom: c.nom,
        email: c.email,
        chiffreAffaires: c.chiffreAffaires,
        nombreFactures: c.nombreFactures,
      }));

    const repartitionSecteurMap = withStats.reduce((acc, c) => {
      const key = c.secteurActivite?.trim() || 'Non renseigne';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const repartitionParSecteur = Object.entries(repartitionSecteurMap).map(([secteur, total]) => ({
      secteur,
      total,
    }));

    return apiResponse.success(
      res,
      {
        top5Clients,
        totalClientsActifs,
        caTotal,
        repartitionParSecteur,
      },
      'Statistiques clients recuperees avec succes'
    );
  } catch (err) {
    return apiResponse.error(res, 'Erreur lors de la recuperation des statistiques clients', 500, err.message);
  }
};

exports.recalculerStatsClient = recalculerStatsClient;
