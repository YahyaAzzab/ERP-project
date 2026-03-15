const apiResponse = require('../utils/apiResponse');
const Facture = require('../models/Facture');
const Employe = require('../models/Employe');
const Conge = require('../models/Conge');
const Produit = require('../models/Produit');
const FichePaie = require('../models/FichePaie');
const MouvementStock = require('../models/MouvementStock');
const mongoose = require('mongoose');

// Helper pour les mois en français
const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

// SECTION A — KPIs Généraux

exports.getKPIsGeneraux = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        const [
            caMoisActuelData,
            caMoisPrecedentData,
            facturesImpayeesData,
            employesActifs,
            congesEnAttente,
            masseSalariale,
            totalProduits,
            produitsEnAlerte,
            valeurStockData
        ] = await Promise.all([
            // Chiffre d'affaires mois actuel
            Facture.aggregate([
                { $match: { statut: 'PAYEE', datePaiement: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: null, total: { $sum: '$montantTTC' } } }
            ]),
            // Chiffre d'affaires mois précédent
            Facture.aggregate([
                { $match: { statut: 'PAYEE', datePaiement: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: '$montantTTC' } } }
            ]),
            // Factures impayées (VALIDEE mais pas PAYEE)
            Facture.aggregate([
                { $match: { statut: 'VALIDEE' } },
                { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$montantTTC' } } }
            ]),
            // RH
            Employe.countDocuments({ statut: 'ACTIF' }),
            Conge.countDocuments({ statut: 'EN_ATTENTE' }),
            Employe.aggregate([
                { $match: { statut: 'ACTIF' } },
                { $group: { _id: null, total: { $sum: '$salaireBrut' } } }
            ]),
            // Stocks
            Produit.countDocuments({ actif: true }),
            Produit.countDocuments({ actif: true, $expr: { $lte: ['$quantiteStock', '$seuilAlerte'] } }),
            Produit.aggregate([
                { $match: { actif: true } },
                { $group: { _id: null, total: { $sum: { $multiply: ['$quantiteStock', '$prixUnitaire'] } } } }
            ])
        ]);

        const chiffreAffairesMoisActuel = caMoisActuelData[0]?.total || 0;
        const chiffreAffairesMoisPrecedent = caMoisPrecedentData[0]?.total || 0;
        let evolutionCA = 0;
        if (chiffreAffairesMoisPrecedent > 0) {
            evolutionCA = ((chiffreAffairesMoisActuel - chiffreAffairesMoisPrecedent) / chiffreAffairesMoisPrecedent) * 100;
        } else if (chiffreAffairesMoisActuel > 0) {
            evolutionCA = 100; // Si 0 le mois d'avant, toute augmentation est "infinie", on met 100%
        }

        const kpis = {
            comptabilite: {
                chiffreAffairesMoisActuel,
                chiffreAffairesMoisPrecedent,
                evolutionCA: parseFloat(evolutionCA.toFixed(2)),
                facturesImpayees: facturesImpayeesData[0]?.count || 0,
                montantFacturesImpayees: facturesImpayeesData[0]?.total || 0,
            },
            rh: {
                totalEmployesActifs: employesActifs,
                congesEnAttente: congesEnAttente,
                masseSalarialeMensuelle: masseSalariale[0]?.total || 0,
            },
            stocks: {
                totalProduits: totalProduits,
                produitsEnAlerte: produitsEnAlerte,
                valeurTotaleStock: valeurStockData[0]?.total || 0,
            }
        };

        return apiResponse.success(res, kpis);

    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur lors de la récupération des KPIs', 500, err.message);
    }
};


// SECTION B — Graphiques Comptabilité

exports.getGraphiqueCA = async (req, res) => {
    try {
        const today = new Date();
        const twelveMonthsAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1);

        const data = await Facture.aggregate([
            { $match: { statut: 'PAYEE', datePaiement: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: "$datePaiement" }, month: { $month: "$datePaiement" } },
                    ca: { $sum: "$montantTTC" },
                    nombreFactures: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Pré-remplir les 12 derniers mois avec 0
        let result = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const moisNom = moisNoms[d.getMonth()];
            
            const monthData = data.find(item => item._id.year === year && item._id.month === month);

            result.push({
                mois: `${moisNom} ${year}`,
                ca: monthData?.ca || 0,
                nombreFactures: monthData?.nombreFactures || 0
            });
        }

        return apiResponse.success(res, result);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getGraphiqueFacturesParStatut = async (req, res) => {
    try {
        const data = await Facture.aggregate([
            { $group: { _id: '$statut', nombre: { $sum: 1 } } }
        ]);

        const couleurs = {
            BROUILLON: '#808080', // gray
            VALIDEE: '#3b82f6', // blue
            PAYEE: '#22c55e', // green
            ANNULEE: '#ef4444', // red
            PARTIELLEMENT_PAYEE: '#f97316' // orange
        };

        const result = data.map(item => ({
            statut: item._id,
            nombre: item.nombre,
            couleur: couleurs[item._id] || '#000000'
        }));

        return apiResponse.success(res, result);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};


// SECTION C — Graphiques RH

exports.getGraphiqueEmployesParDepartement = async (req, res) => {
    try {
        const totalEmployes = await Employe.countDocuments({ statut: 'ACTIF' });
        const data = await Employe.aggregate([
            { $match: { statut: 'ACTIF' } },
            { $group: { _id: '$departement', nombre: { $sum: 1 } } }
        ]);

        const result = data.map(item => ({
            departement: item._id,
            nombre: item.nombre,
            pourcentage: totalEmployes > 0 ? parseFloat(((item.nombre / totalEmployes) * 100).toFixed(2)) : 0
        }));

        return apiResponse.success(res, result);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getGraphiqueMasseSalariale = async (req, res) => {
    try {
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

        const data = await FichePaie.aggregate([
            { $match: { dateCreation: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: "$dateCreation" }, month: { $month: "$dateCreation" } },
                    masseSalariale: { $sum: "$salaireBrut" },
                    nombreFiches: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);
        
        let result = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const moisNom = moisNoms[d.getMonth()];

            const monthData = data.find(item => item._id.year === year && item._id.month === month);

            result.push({
                mois: `${moisNom} ${year}`,
                masseSalariale: monthData?.masseSalariale || 0,
                nombreFiches: monthData?.nombreFiches || 0
            });
        }

        return apiResponse.success(res, result);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getGraphiqueConges = async (req, res) => {
    try {
        const [parType, parStatut] = await Promise.all([
            Conge.aggregate([{ $group: { _id: '$type', nombre: { $sum: 1 } } }]),
            Conge.aggregate([{ $group: { _id: '$statut', nombre: { $sum: 1 } } }])
        ]);

        const result = {
            parType: parType.map(item => ({ type: item._id, nombre: item.nombre })),
            parStatut: parStatut.map(item => ({ statut: item._id, nombre: item.nombre }))
        };

        return apiResponse.success(res, result);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};


// SECTION D — Graphiques Stocks

exports.getGraphiqueMouvementsStock = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const data = await MouvementStock.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo, $lte: today } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        type: "$type"
                    },
                    totalQuantite: { $sum: "$quantite" }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    mouvements: { $push: { type: "$_id.type", total: "$totalQuantite" } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        let result = [];
        const dateMap = new Map(data.map(item => [item._id, item.mouvements]));

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const mouvementsDuJour = dateMap.get(dateStr) || [];
            const entrees = mouvementsDuJour.find(m => m.type === 'ENTREE')?.total || 0;
            const sorties = mouvementsDuJour.find(m => m.type === 'SORTIE')?.total || 0;
            const ajustements = mouvementsDuJour.find(m => m.type === 'AJUSTEMENT')?.total || 0;

            result.push({ date: dateStr, entrees, sorties, ajustements });
        }

        return apiResponse.success(res, result);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getGraphiqueStockParCategorie = async (req, res) => {
    try {
        const result = await Produit.aggregate([
            { $match: { actif: true } },
            {
                $group: {
                    _id: '$categorie',
                    valeur: { $sum: { $multiply: ['$quantiteStock', '$prixUnitaire'] } },
                    quantiteTotale: { $sum: '$quantiteStock' },
                    nombreProduits: { $sum: 1 }
                }
            },
            { $project: { 
                _id: 0, 
                categorie: '$_id', 
                valeur: 1, 
                quantiteTotale: 1, 
                nombreProduits: 1 
            }},
            { $sort: { valeur: -1 } }
        ]);

        return apiResponse.success(res, result);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getAlertesDashboard = async (req, res) => {
    try {
        const [stocks, conges, factures] = await Promise.all([
            // Alerte pour les stocks bas
            Produit.find({ actif: true, $expr: { $lte: ['$quantiteStock', '$seuilAlerte'] } })
                .select('designation reference quantiteStock seuilAlerte')
                .lean(),
            
            // Congés en attente de validation
            Conge.find({ statut: 'EN_ATTENTE' })
                .populate('employe', 'nom prenom matricule') // Ajout matricule pour plus de contexte
                .select('employe type dateDebut nombreJours')
                .lean(),

            // Factures validées mais non payées (impayées)
            Facture.find({ statut: 'VALIDEE' })
                .select('numero client.nom montantTTC dateEcheance')
                .lean()
        ]);

        const alertes = {
            // On s'assure que le produit existe avant de mapper
            stocks: stocks
                .filter(s => s) 
                .map(s => ({
                    produit: s.designation,
                    reference: s.reference,
                    quantiteActuelle: s.quantiteStock,
                    seuilAlerte: s.seuilAlerte,
                    message: `Stock bas pour ${s.designation} (${s.reference}). Quantité: ${s.quantiteStock}, Seuil: ${s.seuilAlerte}.`
                })),

            // On filtre les congés dont l'employé n'existe plus, PUIS on mappe
            congesEnAttente: conges
                .filter(c => c && c.employe) 
                .map(c => ({
                    employe: `${c.employe?.prenom || ''} ${c.employe?.nom || ''}`.trim(),
                    matricule: c.employe?.matricule || 'N/A',
                    type: c.type,
                    dateDebut: c.dateDebut,
                    nombreJours: c.nombreJours,
                    message: `Demande de congé de ${c.nombreJours} jour(s) par ${c.employe?.prenom} ${c.employe?.nom} à valider.`
                })),

            // On s'assure que la facture et son client existent
            facturesImpayees: factures
                .filter(f => f && f.client)
                .map(f => ({
                    numero: f.numero,
                    client: f.client?.nom || 'Client non défini',
                    montant: f.montantTTC,
                    dateEcheance: f.dateEcheance,
                    message: `Facture N°${f.numero} de ${f.montantTTC}€ pour ${f.client?.nom} est impayée.`
                }))
        };

        return apiResponse.success(res, alertes);
    } catch (err) {
        console.error("Erreur dans getAlertesDashboard:", err);
        return apiResponse.error(res, 'Erreur serveur lors de la récupération des alertes', 500, err.message);
    }
};
