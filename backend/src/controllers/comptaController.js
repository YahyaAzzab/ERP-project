// =============================================================
// backend/src/controllers/comptaController.js
// API Module Comptabilite
// =============================================================

const mongoose = require('mongoose');

const CompteComptable = require('../models/CompteComptable');
const EcritureComptable = require('../models/EcritureComptable');
const Facture = require('../models/Facture');
const { success, error, paginate, created } = require('../utils/apiResponse');

const { isValidObjectId } = mongoose;

const TYPES_COMPTE = ['ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT'];
const JOURNAUX = ['VENTES', 'ACHATS', 'BANQUE', 'CAISSE', 'OD', 'GENERAL'];

const FACTURE_STATUS = ['BROUILLON', 'VALIDEE', 'PAYEE', 'ANNULEE'];
const FACTURE_TRANSITIONS = {
  BROUILLON: ['VALIDEE', 'ANNULEE'],
  VALIDEE: ['PAYEE', 'ANNULEE'],
  PAYEE: [],
  ANNULEE: [],
};

const normalizeStatus = (value = '') => {
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÀÂÄ]/g, 'A')
    .replace(/[ÙÛÜ]/g, 'U')
    .replace(/[ÎÏ]/g, 'I')
    .replace(/[ÔÖ]/g, 'O');
};

const parseBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const buildDateFilter = (dateDebut, dateFin) => {
  if (!dateDebut && !dateFin) return undefined;
  const dateFilter = {};
  if (dateDebut) dateFilter.$gte = new Date(dateDebut);
  if (dateFin) {
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  return dateFilter;
};

const mapEcriture = (ecriture) => {
  const obj = ecriture.toObject ? ecriture.toObject() : ecriture;
  if (obj.saisiePar) {
    obj.creePar = obj.saisiePar;
  }
  return obj;
};

const generateFactureNumero = async () => {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const lastFacture = await Facture.findOne({ numero: { $regex: `^${prefix}` } })
    .sort({ numero: -1 })
    .select('numero')
    .lean();

  let sequence = 1;
  if (lastFacture?.numero) {
    const parts = lastFacture.numero.split('-');
    const lastNumber = parseInt(parts[2], 10);
    sequence = Number.isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

const ensureFactureMutable = (facture) => {
  const statut = normalizeStatus(facture.statut);
  return statut === 'BROUILLON';
};

// =============================================================
// SECTION A — COMPTES COMPTABLES
// =============================================================

const getComptes = async (req, res) => {
  try {
    const { type, search, actif } = req.query;
    const filter = {};

    if (type) {
      const normalizedType = normalizeStatus(type);
      if (!TYPES_COMPTE.includes(normalizedType)) {
        return error(res, `Type invalide. Valeurs: ${TYPES_COMPTE.join(', ')}`, 400);
      }
      filter.type = normalizedType;
    }

    const actifParsed = parseBool(actif);
    if (typeof actifParsed === 'boolean') {
      filter.actif = actifParsed;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ libelle: regex }, { numero: regex }];
    }

    const comptes = await CompteComptable.find(filter).sort({ numero: 1 });
    return success(res, { comptes }, 'Comptes recuperes avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation des comptes', 500);
  }
};

const getCompteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID de compte invalide', 400);

    const compte = await CompteComptable.findById(id);
    if (!compte) return error(res, 'Compte introuvable', 404);

    return success(res, { compte }, 'Compte recupere avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation du compte', 500);
  }
};

const createCompte = async (req, res) => {
  try {
    const { numero, libelle, type, description, actif } = req.body;

    if (!numero || !libelle || !type) {
      return error(res, 'numero, libelle et type sont obligatoires', 400);
    }

    const normalizedType = normalizeStatus(type);
    if (!TYPES_COMPTE.includes(normalizedType)) {
      return error(res, `Type invalide. Valeurs: ${TYPES_COMPTE.join(', ')}`, 400);
    }

    const existing = await CompteComptable.findOne({ numero: String(numero).trim() });
    if (existing) return error(res, 'Ce numero de compte existe deja', 409);

    const compte = await CompteComptable.create({
      numero: String(numero).trim(),
      libelle: String(libelle).trim(),
      type: normalizedType,
      description,
      actif: typeof actif === 'boolean' ? actif : true,
    });

    return created(res, { compte }, 'Compte cree avec succes');
  } catch (err) {
    if (err.code === 11000) return error(res, 'Ce numero de compte existe deja', 409);
    return error(res, 'Erreur lors de la creation du compte', 500);
  }
};

const updateCompte = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID de compte invalide', 400);

    const compte = await CompteComptable.findById(id);
    if (!compte) return error(res, 'Compte introuvable', 404);

    const allowed = ['libelle', 'description', 'actif'];
    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        compte[field] = req.body[field];
      }
    });

    await compte.save();
    return success(res, { compte }, 'Compte mis a jour avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la mise a jour du compte', 500);
  }
};

const deleteCompte = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID de compte invalide', 400);

    const compte = await CompteComptable.findById(id);
    if (!compte) return error(res, 'Compte introuvable', 404);

    const usageCount = await EcritureComptable.countDocuments({ compte: id });
    if (usageCount > 0) {
      return error(
        res,
        'Impossible de supprimer : ce compte a des ecritures associees',
        400
      );
    }

    await CompteComptable.findByIdAndDelete(id);
    return success(res, null, 'Compte supprime avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la suppression du compte', 500);
  }
};

// =============================================================
// SECTION B — ECRITURES COMPTABLES
// =============================================================

const getEcritures = async (req, res) => {
  try {
    const { compteId, dateDebut, dateFin, journal } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    if (compteId) {
      if (!isValidObjectId(compteId)) return error(res, 'compteId invalide', 400);
      filter.compte = compteId;
    }

    if (journal) {
      const j = normalizeStatus(journal);
      if (!JOURNAUX.includes(j)) {
        return error(res, `Journal invalide. Valeurs: ${JOURNAUX.join(', ')}`, 400);
      }
      filter.journal = j;
    }

    const dateFilter = buildDateFilter(dateDebut, dateFin);
    if (dateFilter) filter.date = dateFilter;

    const [total, docs] = await Promise.all([
      EcritureComptable.countDocuments(filter),
      EcritureComptable.find(filter)
        .populate('compte', 'numero libelle type')
        .populate('saisiePar', 'nom prenom email role')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const ecritures = docs.map(mapEcriture);
    return paginate(res, { ecritures }, total, page, limit, 'Ecritures recuperees avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation des ecritures', 500);
  }
};

const getEcritureById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID d ecriture invalide', 400);

    const doc = await EcritureComptable.findById(id)
      .populate('compte', 'numero libelle type')
      .populate('saisiePar', 'nom prenom email role');

    if (!doc) return error(res, 'Ecriture introuvable', 404);

    return success(res, { ecriture: mapEcriture(doc) }, 'Ecriture recuperee avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation de l ecriture', 500);
  }
};

const createEcriture = async (req, res) => {
  try {
    const {
      date,
      libelle,
      montantDebit = 0,
      montantCredit = 0,
      compteId,
      journal,
      reference,
      factureId,
    } = req.body;

    if (!date || !libelle || !compteId || !journal) {
      return error(res, 'date, libelle, compteId et journal sont obligatoires', 400);
    }

    if (!isValidObjectId(compteId)) return error(res, 'compteId invalide', 400);

    const debit = Number(montantDebit || 0);
    const credit = Number(montantCredit || 0);

    if (debit <= 0 && credit <= 0) {
      return error(res, 'montantDebit ou montantCredit doit etre > 0', 400);
    }

    const normalizedJournal = normalizeStatus(journal);
    if (!JOURNAUX.includes(normalizedJournal)) {
      return error(res, `Journal invalide. Valeurs: ${JOURNAUX.join(', ')}`, 400);
    }

    const compte = await CompteComptable.findById(compteId);
    if (!compte || !compte.actif) {
      return error(res, 'Le compte comptable est introuvable ou inactif', 400);
    }

    const payload = {
      date: new Date(date),
      libelle: String(libelle).trim(),
      montantDebit: debit,
      montantCredit: credit,
      compte: compteId,
      journal: normalizedJournal,
      reference,
      saisiePar: req.user._id,
    };

    if (factureId) {
      if (!isValidObjectId(factureId)) return error(res, 'factureId invalide', 400);
      payload.facture = factureId;
    }

    const doc = await EcritureComptable.create(payload);

    const populated = await EcritureComptable.findById(doc._id)
      .populate('compte', 'numero libelle type')
      .populate('saisiePar', 'nom prenom email role');

    return created(res, { ecriture: mapEcriture(populated) }, 'Ecriture creee avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la creation de l ecriture', 500);
  }
};

const ensureFactureNotLocked = async (ecriture) => {
  if (!ecriture.facture) return null;
  const facture = await Facture.findById(ecriture.facture).select('statut');
  if (!facture) return null;
  const status = normalizeStatus(facture.statut);
  if (status === 'VALIDEE' || status === 'PAYEE') {
    return 'Impossible de modifier une ecriture liee a une facture validee';
  }
  return null;
};

const updateEcriture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID d ecriture invalide', 400);

    const ecriture = await EcritureComptable.findById(id);
    if (!ecriture) return error(res, 'Ecriture introuvable', 404);

    const lockMsg = await ensureFactureNotLocked(ecriture);
    if (lockMsg) return error(res, lockMsg, 400);

    const allowed = ['date', 'libelle', 'montantDebit', 'montantCredit', 'journal', 'reference'];

    if (Object.prototype.hasOwnProperty.call(req.body, 'compteId')) {
      if (!isValidObjectId(req.body.compteId)) return error(res, 'compteId invalide', 400);
      const compte = await CompteComptable.findById(req.body.compteId);
      if (!compte || !compte.actif) {
        return error(res, 'Le compte comptable est introuvable ou inactif', 400);
      }
      ecriture.compte = req.body.compteId;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'factureId')) {
      if (!isValidObjectId(req.body.factureId)) return error(res, 'factureId invalide', 400);
      ecriture.facture = req.body.factureId;
    }

    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'journal') {
          const normalizedJournal = normalizeStatus(req.body[field]);
          if (JOURNAUX.includes(normalizedJournal)) {
            ecriture[field] = normalizedJournal;
          }
        } else {
          ecriture[field] = req.body[field];
        }
      }
    });

    const debit = Number(ecriture.montantDebit || 0);
    const credit = Number(ecriture.montantCredit || 0);
    if (debit <= 0 && credit <= 0) {
      return error(res, 'montantDebit ou montantCredit doit etre > 0', 400);
    }

    await ecriture.save();

    const populated = await EcritureComptable.findById(ecriture._id)
      .populate('compte', 'numero libelle type')
      .populate('saisiePar', 'nom prenom email role');

    return success(res, { ecriture: mapEcriture(populated) }, 'Ecriture mise a jour avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la mise a jour de l ecriture', 500);
  }
};

const deleteEcriture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID d ecriture invalide', 400);

    const ecriture = await EcritureComptable.findById(id);
    if (!ecriture) return error(res, 'Ecriture introuvable', 404);

    const lockMsg = await ensureFactureNotLocked(ecriture);
    if (lockMsg) return error(res, lockMsg, 400);

    await EcritureComptable.findByIdAndDelete(id);
    return success(res, null, 'Ecriture supprimee avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la suppression de l ecriture', 500);
  }
};

const getGrandLivre = async (req, res) => {
  try {
    const { compteId } = req.params;
    if (!isValidObjectId(compteId)) return error(res, 'compteId invalide', 400);

    const compte = await CompteComptable.findById(compteId).select('numero libelle type');
    if (!compte) return error(res, 'Compte introuvable', 404);

    const ecrituresRaw = await EcritureComptable.find({ compte: compteId })
      .populate('saisiePar', 'nom prenom email role')
      .sort({ date: 1, _id: 1 })
      .lean();

    let running = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ecritures = ecrituresRaw.map((e) => {
      const debit = Number(e.montantDebit || 0);
      const credit = Number(e.montantCredit || 0);
      totalDebit += debit;
      totalCredit += credit;
      running += debit - credit;
      return {
        ...e,
        creePar: e.saisiePar || null,
        soldeCumulatif: running,
      };
    });

    return success(res, {
      compte,
      ecritures,
      totaux: {
        totalDebit,
        totalCredit,
        soldeFinal: running,
      },
    }, 'Grand livre recupere avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la generation du grand livre', 500);
  }
};

const getBalanceGenerale = async (req, res) => {
  try {
    const balanceByCompte = await CompteComptable.aggregate([
      {
        $lookup: {
          from: 'ecriturecomptables',
          localField: '_id',
          foreignField: 'compte',
          as: 'ecritures',
        },
      },
      {
        $addFields: {
          totalDebit: { $sum: '$ecritures.montantDebit' },
          totalCredit: { $sum: '$ecritures.montantCredit' },
        },
      },
      {
        $addFields: {
          solde: { $subtract: ['$totalDebit', '$totalCredit'] },
        },
      },
      {
        $project: {
          ecritures: 0,
        },
      },
      { $sort: { numero: 1 } },
    ]);

    const parType = {};
    TYPES_COMPTE.forEach((type) => {
      parType[type] = { totalDebit: 0, totalCredit: 0, solde: 0, comptes: [] };
    });

    balanceByCompte.forEach((c) => {
      const type = c.type;
      if (!parType[type]) {
        parType[type] = { totalDebit: 0, totalCredit: 0, solde: 0, comptes: [] };
      }
      parType[type].comptes.push(c);
      parType[type].totalDebit += c.totalDebit || 0;
      parType[type].totalCredit += c.totalCredit || 0;
      parType[type].solde += c.solde || 0;
    });

    const totauxGeneraux = balanceByCompte.reduce(
      (acc, c) => {
        acc.totalDebit += c.totalDebit || 0;
        acc.totalCredit += c.totalCredit || 0;
        acc.solde += c.solde || 0;
        return acc;
      },
      { totalDebit: 0, totalCredit: 0, solde: 0 }
    );

    return success(res, {
      comptes: balanceByCompte,
      parType,
      totauxGeneraux,
    }, 'Balance generale recuperee avec succes');
  } catch (err) {
    return error(res, 'Erreur lors du calcul de la balance generale', 500);
  }
};

// =============================================================
// SECTION C — FACTURES
// =============================================================

const getFactures = async (req, res) => {
  try {
    const { statut, search, dateDebut, dateFin } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    if (statut) {
      const normalizedStatus = normalizeStatus(statut);
      if (!FACTURE_STATUS.includes(normalizedStatus)) {
        return error(res, `Statut invalide. Valeurs: ${FACTURE_STATUS.join(', ')}`, 400);
      }
      filter.statut = normalizedStatus;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ numero: regex }, { clientNom: regex }];
    }

    const dateFilter = buildDateFilter(dateDebut, dateFin);
    if (dateFilter) filter.date = dateFilter;

    const [total, docs] = await Promise.all([
      Facture.countDocuments(filter),
      Facture.find(filter)
        .populate('creePar', 'nom prenom email role')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return paginate(res, { factures: docs }, total, page, limit, 'Factures recuperees avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation des factures', 500);
  }
};

const getFactureById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID de facture invalide', 400);

    const facture = await Facture.findById(id)
      .populate('creePar', 'nom prenom email role')
      .populate({
        path: 'ecrituresComptables',
        populate: [
          { path: 'compte', select: 'numero libelle type' },
          { path: 'saisiePar', select: 'nom prenom email role' },
        ],
      });

    if (!facture) return error(res, 'Facture introuvable', 404);

    return success(res, { facture }, 'Facture recuperee avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation de la facture', 500);
  }
};

const sanitizeLignes = (lignes, tva = 20) => {
  if (!Array.isArray(lignes) || lignes.length === 0) {
    return { valid: false, message: 'lignes doit etre un tableau non vide', lignes: [] };
  }

  const tvaPercent = Number(tva ?? 20);

  const sanitized = lignes.map((l) => ({
    designation: l.designation,
    quantite: Number(l.quantite),
    prixUnitaire: Number(l.prixUnitaire),
    tvaPercent,
    produit: l.produit || undefined,
  }));

  const invalid = sanitized.find(
    (l) => !l.designation || Number.isNaN(l.quantite) || Number.isNaN(l.prixUnitaire) || l.quantite <= 0 || l.prixUnitaire < 0
  );

  if (invalid) {
    return {
      valid: false,
      message: 'Chaque ligne doit contenir designation, quantite > 0 et prixUnitaire >= 0',
      lignes: [],
    };
  }

  return { valid: true, lignes: sanitized };
};

const createFacture = async (req, res) => {
  try {
    const { client = {}, clientNom, clientEmail, clientAdresse, lignes, tva = 20, notes, dateEcheance } = req.body;

    const nomClient = (client.nom || clientNom || '').trim();
    if (!nomClient) return error(res, 'client.nom est requis', 400);

    const sanitized = sanitizeLignes(lignes, tva);
    if (!sanitized.valid) return error(res, sanitized.message, 400);

    const numero = await generateFactureNumero();

    const facture = await Facture.create({
      numero,
      date: new Date(),
      clientNom: nomClient,
      clientEmail: (client.email || clientEmail || '').trim() || undefined,
      clientAdresse: (client.adresse || clientAdresse || '').trim() || undefined,
      lignes: sanitized.lignes,
      notes,
      dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
      statut: 'BROUILLON',
      creePar: req.user._id,
    });

    return created(res, { facture }, 'Facture creee avec succes');
  } catch (err) {
    if (err.code === 11000) {
      return error(res, 'Numero de facture deja existant. Reessayez.', 409);
    }
    return error(res, 'Erreur lors de la creation de la facture', 500);
  }
};

const updateFacture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID de facture invalide', 400);

    const facture = await Facture.findById(id);
    if (!facture) return error(res, 'Facture introuvable', 404);

    if (!ensureFactureMutable(facture)) {
      return error(res, 'Impossible de modifier une facture validee ou payee', 400);
    }

    const { client = {}, clientNom, clientEmail, clientAdresse, lignes, tva, notes, dateEcheance } = req.body;

    const updatedNom = (client.nom || clientNom || facture.clientNom || '').trim();
    if (!updatedNom) return error(res, 'client.nom est requis', 400);
    facture.clientNom = updatedNom;

    if (Object.prototype.hasOwnProperty.call(req.body, 'client') || Object.prototype.hasOwnProperty.call(req.body, 'clientEmail')) {
      const mail = (client.email || clientEmail || '').trim();
      facture.clientEmail = mail || undefined;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'client') || Object.prototype.hasOwnProperty.call(req.body, 'clientAdresse')) {
      const adr = (client.adresse || clientAdresse || '').trim();
      facture.clientAdresse = adr || undefined;
    }

    if (Array.isArray(lignes)) {
      const sanitized = sanitizeLignes(lignes, tva ?? 20);
      if (!sanitized.valid) return error(res, sanitized.message, 400);
      facture.lignes = sanitized.lignes;
    }

    if (notes !== undefined) facture.notes = notes;
    if (dateEcheance !== undefined) facture.dateEcheance = dateEcheance ? new Date(dateEcheance) : undefined;

    await facture.save();

    return success(res, { facture }, 'Facture mise a jour avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la mise a jour de la facture', 500);
  }
};

const updateStatutFacture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID de facture invalide', 400);

    const facture = await Facture.findById(id);
    if (!facture) return error(res, 'Facture introuvable', 404);

    const nextStatut = normalizeStatus(req.body.statut);
    if (!FACTURE_STATUS.includes(nextStatut)) {
      return error(res, `Statut invalide. Valeurs: ${FACTURE_STATUS.join(', ')}`, 400);
    }

    const current = normalizeStatus(facture.statut);
    const allowed = FACTURE_TRANSITIONS[current] || [];

    if (!allowed.includes(nextStatut)) {
      return error(res, 'Transition de statut non autorisee', 400);
    }

    if (current === 'BROUILLON' && nextStatut === 'VALIDEE') {
      const compteClient = await CompteComptable.findOne({ numero: '411', actif: true });
      const compteVentes = await CompteComptable.findOne({ numero: '701', actif: true });

      if (!compteClient || !compteVentes) {
        return error(res, 'Comptes 411 et 701 requis pour valider la facture', 400);
      }

      const ecritureDebit = await EcritureComptable.create({
        date: new Date(),
        libelle: `Validation facture ${facture.numero} - Client`,
        montantDebit: facture.montantTTC,
        montantCredit: 0,
        compte: compteClient._id,
        facture: facture._id,
        journal: 'VENTES',
        reference: facture.numero,
        saisiePar: req.user._id,
      });

      const ecritureCredit = await EcritureComptable.create({
        date: new Date(),
        libelle: `Validation facture ${facture.numero} - Vente`,
        montantDebit: 0,
        montantCredit: facture.montantHT,
        compte: compteVentes._id,
        facture: facture._id,
        journal: 'VENTES',
        reference: facture.numero,
        saisiePar: req.user._id,
      });

      facture.ecrituresComptables = [ecritureDebit._id, ecritureCredit._id];
    }

    facture.statut = nextStatut;
    await facture.save();

    const populated = await Facture.findById(facture._id)
      .populate('creePar', 'nom prenom email role')
      .populate('ecrituresComptables');

    return success(res, { facture: populated }, 'Statut de facture mis a jour avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la mise a jour du statut de facture', 500);
  }
};

const deleteFacture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return error(res, 'ID de facture invalide', 400);

    const facture = await Facture.findById(id);
    if (!facture) return error(res, 'Facture introuvable', 404);

    if (normalizeStatus(facture.statut) !== 'BROUILLON') {
      return error(res, 'Seules les factures brouillon peuvent etre supprimees', 400);
    }

    await Facture.findByIdAndDelete(id);
    return success(res, null, 'Facture supprimee avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la suppression de la facture', 500);
  }
};

module.exports = {
  // Comptes
  getComptes,
  getCompteById,
  createCompte,
  updateCompte,
  deleteCompte,

  // Ecritures
  getEcritures,
  getEcritureById,
  createEcriture,
  updateEcriture,
  deleteEcriture,
  getGrandLivre,
  getBalanceGenerale,

  // Factures
  getFactures,
  getFactureById,
  createFacture,
  updateFacture,
  updateStatutFacture,
  deleteFacture,
};
