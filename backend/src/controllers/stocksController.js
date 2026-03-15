const Fournisseur = require('../models/Fournisseur');
const Produit = require('../models/Produit');
const MouvementStock = require('../models/MouvementStock');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Helper pour générer la référence produit
const generateProduitReference = async () => {
    const lastProduit = await Produit.findOne().sort({ reference: -1 });
    if (!lastProduit || !lastProduit.reference || !lastProduit.reference.startsWith('PROD-')) {
        return 'PROD-001';
    }
    const lastId = parseInt(lastProduit.reference.split('-')[1], 10);
    const newId = (lastId + 1).toString().padStart(3, '0');
    return `PROD-${newId}`;
};

// SECTION A — Fournisseurs

exports.getFournisseurs = async (req, res) => {
    try {
        const { search, actif, page = 1, limit = 10 } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { 'adresse.ville': { $regex: search, $options: 'i' } }
            ];
        }
        if (actif) query.actif = actif === 'true';

        const fournisseurs = await Fournisseur.find(query)
            .sort({ nom: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Fournisseur.countDocuments(query);
        return apiResponse.paginate(res, fournisseurs, page, limit, count);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getFournisseurById = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findById(req.params.id);
        if (!fournisseur) {
            return apiResponse.error(res, 'Fournisseur introuvable', 404);
        }
        const produits = await Produit.find({ fournisseur: req.params.id });
        const data = { ...fournisseur.toObject(), produits };
        return apiResponse.success(res, data);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.createFournisseur = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.error(res, 'Données invalides', 422, errors.array());
    }
    try {
        const newFournisseur = new Fournisseur(req.body);
        const savedFournisseur = await newFournisseur.save();
        return apiResponse.created(res, savedFournisseur);
    } catch (err) {
        return apiResponse.error(res, 'Erreur création fournisseur', 500, err.message);
    }
};

exports.updateFournisseur = async (req, res) => {
    try {
        const updatedFournisseur = await Fournisseur.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedFournisseur) {
            return apiResponse.error(res, 'Fournisseur introuvable', 404);
        }
        return apiResponse.success(res, updatedFournisseur);
    } catch (err) {
        return apiResponse.error(res, 'Erreur mise à jour', 500, err.message);
    }
};

exports.deleteFournisseur = async (req, res) => {
    try {
        const productCount = await Produit.countDocuments({ fournisseur: req.params.id, actif: true });
        if (productCount > 0) {
            return apiResponse.error(res, 'Impossible de supprimer : ce fournisseur a des produits actifs associés', 400);
        }
        const fournisseur = await Fournisseur.findByIdAndDelete(req.params.id);
        if (!fournisseur) {
            return apiResponse.error(res, 'Fournisseur introuvable', 404);
        }
        return apiResponse.success(res, { message: 'Fournisseur supprimé avec succès' });
    } catch (err) {
        return apiResponse.error(res, 'Erreur suppression', 500, err.message);
    }
};

// SECTION B — Produits

exports.getProduits = async (req, res) => {
    try {
        const { categorie, search, actif, enAlerte, fournisseurId, page = 1, limit = 10 } = req.query;
        let query = {};

        if (categorie) query.categorie = categorie;
        if (search) {
            query.$or = [
                { reference: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } }
            ];
        }
        if (actif) query.actif = actif === 'true';
        if (fournisseurId) query.fournisseur = fournisseurId;
        if (enAlerte === 'true') {
            query.$expr = { $lte: ['$quantiteStock', '$seuilAlerte'] };
        }

        const produits = await Produit.find(query)
            .populate('fournisseur', 'nom')
            .sort({ designation: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Produit.countDocuments(query);
        return apiResponse.paginate(res, produits, page, limit, count);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getProduitById = async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id).populate('fournisseur');
        if (!produit) {
            return apiResponse.error(res, 'Produit introuvable', 404);
        }
        const derniersMouvements = await MouvementStock.find({ produit: req.params.id })
            .sort({ date: -1 })
            .limit(10);
        const data = { ...produit.toObject(), derniersMouvements };
        return apiResponse.success(res, data);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.createProduit = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.error(res, 'Données invalides', 422, errors.array());
    }
    try {
        const reference = await generateProduitReference();
        const newProduit = new Produit({
            ...req.body,
            reference,
            quantiteStock: 0,
            seuilAlerte: req.body.seuilAlerte || 10,
            actif: true
        });
        const savedProduit = await newProduit.save();
        return apiResponse.created(res, savedProduit);
    } catch (err) {
        return apiResponse.error(res, 'Erreur création produit', 500, err.message);
    }
};

exports.updateProduit = async (req, res) => {
    try {
        const { designation, description, categorie, unite, seuilAlerte, prixUnitaire, prixAchat, fournisseur, actif } = req.body;
        const updatedProduit = await Produit.findByIdAndUpdate(
            req.params.id,
            { designation, description, categorie, unite, seuilAlerte, prixUnitaire, prixAchat, fournisseur, actif },
            { new: true }
        );
        if (!updatedProduit) {
            return apiResponse.error(res, 'Produit introuvable', 404);
        }
        return apiResponse.success(res, updatedProduit);
    } catch (err) {
        return apiResponse.error(res, 'Erreur mise à jour', 500, err.message);
    }
};

exports.deleteProduit = async (req, res) => {
    try {
        const movementCount = await MouvementStock.countDocuments({ produit: req.params.id });
        if (movementCount > 0) {
            return apiResponse.error(res, 'Impossible de supprimer : ce produit a des mouvements de stock', 400);
        }
        const produit = await Produit.findByIdAndDelete(req.params.id);
        if (!produit) {
            return apiResponse.error(res, 'Produit introuvable', 404);
        }
        return apiResponse.success(res, { message: 'Produit supprimé avec succès' });
    } catch (err) {
        return apiResponse.error(res, 'Erreur suppression', 500, err.message);
    }
};

exports.getProduitsEnAlerte = async (req, res) => {
    try {
        const produits = await Produit.find({ $expr: { $lte: ['$quantiteStock', '$seuilAlerte'] } })
            .sort({ 'quantiteStock': 1 }); // Simple sort, complex one is ($seuilAlerte - $quantiteStock)

        return apiResponse.success(res, {
            total: produits.length,
            produits
        });
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Produit.distinct('categorie');
        return apiResponse.success(res, categories);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

// SECTION C — Mouvements de Stock

exports.getMouvements = async (req, res) => {
    try {
        const { produitId, type, dateDebut, dateFin, effectuePar, page = 1, limit = 20 } = req.query;
        let query = {};

        if (produitId) query.produit = produitId;
        if (type) query.type = type;
        if (effectuePar) query.effectuePar = effectuePar;
        if (dateDebut && dateFin) {
            query.date = { $gte: new Date(dateDebut), $lte: new Date(dateFin) };
        }

        const mouvements = await MouvementStock.find(query)
            .populate('produit', 'reference designation')
            .populate({
                path: 'effectuePar',
                select: 'nom prenom',
                model: User
             })
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await MouvementStock.countDocuments(query);
        return apiResponse.paginate(res, mouvements, page, limit, count);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getMouvementById = async (req, res) => {
    try {
        const mouvement = await MouvementStock.findById(req.params.id)
            .populate('produit')
            .populate('effectuePar');
        if (!mouvement) {
            return apiResponse.error(res, 'Mouvement introuvable', 404);
        }
        return apiResponse.success(res, mouvement);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

const createMouvement = async (produitId, quantite, type, motif, reference, userId) => {
    const produit = await Produit.findById(produitId);
    if (!produit) throw new Error('Produit introuvable');
    if (!produit.actif) throw new Error('Le produit n\'est pas actif');

    const quantiteAvant = produit.quantiteStock;
    let nouvelleQuantite;

    if (type === 'ENTREE') {
        nouvelleQuantite = quantiteAvant + quantite;
    } else if (type === 'SORTIE') {
        if (quantiteAvant < quantite) {
            throw new Error(`Stock insuffisant : ${quantiteAvant} unités disponibles, ${quantite} demandées`);
        }
        nouvelleQuantite = quantiteAvant - quantite;
    } else { // AJUSTEMENT
        nouvelleQuantite = quantite; // ici quantite est la nouvelle valeur totale
    }
    
    produit.quantiteStock = nouvelleQuantite;
    await produit.save();

    const mouvement = new MouvementStock({
        produit: produitId,
        type,
        quantite: type === 'AJUSTEMENT' ? (nouvelleQuantite - quantiteAvant) : quantite,
        quantiteAvant,
        quantiteApres: nouvelleQuantite,
        motif,
        reference,
        effectuePar: userId,
    });
    await mouvement.save();

    let alerte = null;
    if (produit.quantiteStock <= produit.seuilAlerte) {
        alerte = { alerte: true, message: "⚠️ Stock sous le seuil d'alerte" };
    }

    return { mouvement, produit, alerte };
};

exports.entreeStock = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.error(res, 'Données invalides', 422, errors.array());
    }
    try {
        const { produitId, quantite, motif, reference } = req.body;
        const result = await createMouvement(produitId, quantite, 'ENTREE', motif, reference, req.user._id);
        return apiResponse.created(res, result);
    } catch (err) {
        return apiResponse.error(res, err.message, 400);
    }
};

exports.sortieStock = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.error(res, 'Données invalides', 422, errors.array());
    }
    try {
        const { produitId, quantite, motif, reference } = req.body;
        const result = await createMouvement(produitId, quantite, 'SORTIE', motif, reference, req.user._id);
        return apiResponse.created(res, result);
    } catch (err) {
        return apiResponse.error(res, err.message, 400);
    }
};

exports.ajustementStock = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.error(res, 'Données invalides', 422, errors.array());
    }
    try {
        const { produitId, nouvelleQuantite, motif } = req.body;
        const result = await createMouvement(produitId, nouvelleQuantite, 'AJUSTEMENT', motif, null, req.user._id);
        return apiResponse.created(res, result);
    } catch (err) {
        return apiResponse.error(res, err.message, 400);
    }
};

// SECTION D — Inventaire & Statistiques

exports.getInventaire = async (req, res) => {
    try {
        const produits = await Produit.find().lean();
        const totalProduits = produits.length;
        const produitsActifs = produits.filter(p => p.actif).length;
        const produitsEnAlerte = produits.filter(p => p.quantiteStock <= p.seuilAlerte).length;

        const valeurTotaleStock = produits.reduce((acc, p) => acc + (p.quantiteStock * p.prixUnitaire), 0);

        const valeurParCategorie = await Produit.aggregate([
            {
                $group: {
                    _id: '$categorie',
                    valeur: { $sum: { $multiply: ['$quantiteStock', '$prixUnitaire'] } },
                    quantite: { $sum: '$quantiteStock' }
                }
            },
            { $project: { categorie: '$_id', valeur: 1, quantite: 1, _id: 0 } }
        ]);

        return apiResponse.success(res, {
            produits,
            totalProduits,
            produitsActifs,
            produitsEnAlerte,
            valeurTotaleStock,
            valeurParCategorie
        });
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getStatistiquesStocks = async (req, res) => {
    try {
        const dateIlY30Jours = new Date();
        dateIlY30Jours.setDate(dateIlY30Jours.getDate() - 30);

        const mouvementsParJour = await MouvementStock.aggregate([
            { $match: { date: { $gte: dateIlY30Jours } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const top5Produits = await MouvementStock.aggregate([
            { $group: { _id: '$produit', totalMouvements: { $sum: 1 } } },
            { $sort: { totalMouvements: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'produits', localField: '_id', foreignField: '_id', as: 'produitInfo' } },
            { $unwind: '$produitInfo' }
        ]);

        const repartitionType = await MouvementStock.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        
        const [valeurStock, produitsAlerte] = await Promise.all([
             Produit.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$quantiteStock', '$prixUnitaire'] } } } }]),
             Produit.countDocuments({ $expr: { $lte: ['$quantiteStock', '$seuilAlerte'] } })
        ]);

        return apiResponse.success(res, {
            mouvementsParJour,
            top5Produits,
            repartitionType,
            valeurTotaleStock: valeurStock.length > 0 ? valeurStock[0].total : 0,
            nombreProduitsEnAlerte: produitsAlerte
        });
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};
