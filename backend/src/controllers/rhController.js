const Employe = require('../models/Employe');
const Conge = require('../models/Conge');
const FichePaie = require('../models/FichePaie');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Helper pour calculer les jours ouvrés
const calculerJoursOuvres = (dateDebut, dateFin) => {
    let jours = 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    while (debut <= fin) {
        const day = debut.getDay();
        if (day !== 0 && day !== 6) { // 0 = Dimanche, 6 = Samedi
            jours++;
        }
        debut.setDate(debut.getDate() + 1);
    }
    return jours;
};

// Helper pour générer le matricule
const generateMatricule = async () => {
    const lastEmploye = await Employe.findOne().sort({ matricule: -1 });
    if (!lastEmploye || !lastEmploye.matricule || !lastEmploye.matricule.startsWith('EMP-')) {
        return 'EMP-001';
    }
    const lastId = parseInt(lastEmploye.matricule.split('-')[1], 10);
    const newId = (lastId + 1).toString().padStart(3, '0');
    return `EMP-${newId}`;
};


// SECTION A — Employés

exports.getEmployes = async (req, res) => {
    try {
        const { departement, statut, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (departement) query.departement = departement;
        if (statut) query.statut = statut;
        if (search) {
            query.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { prenom: { $regex: search, $options: 'i' } },
                { matricule: { $regex: search, $options: 'i' } }
            ];
        }

        const employes = await Employe.find(query)
            .sort({ nom: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Employe.countDocuments(query);

        return apiResponse.paginate(res, employes, count, page, limit);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getEmployeById = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id).populate('user', 'email');
        if (!employe) {
            return apiResponse.error(res, 'Employé introuvable', 404);
        }

        const derniersConges = await Conge.find({ employe: req.params.id })
            .sort({ dateDebut: -1 })
            .limit(5);

        const dernieresFichesPaie = await FichePaie.find({ employe: req.params.id })
            .sort({ annee: -1, mois: -1 })
            .limit(3);
            
        const data = {
            ...employe.toObject(),
            derniersConges,
            dernieresFichesPaie
        };

        return apiResponse.success(res, data);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.createEmploye = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.error(res, 'Données de validation invalides', 422, errors.array());
    }

    try {
        const { nom, prenom, email, poste, departement, dateEmbauche, salaireBrut, typeContrat, telephone, adresse } = req.body;

        const matricule = await generateMatricule();

        const newEmploye = new Employe({
            nom,
            prenom,
            email,
            poste,
            departement,
            dateEmbauche,
            salaireBrut,
            typeContrat,
            telephone,
            adresse,
            matricule,
            soldeConges: 18, // Valeur par défaut
            statut: 'ACTIF'
        });

        const savedEmploye = await newEmploye.save();
        return apiResponse.created(res, savedEmploye);

    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de la création de l\'employé', 500, err.message);
    }
};

exports.updateEmploye = async (req, res) => {
    try {
        const { nom, prenom, email, poste, departement, telephone, adresse, salaireBrut, typeContrat, statut } = req.body;
        
        const employe = await Employe.findById(req.params.id);
        if (!employe) {
            return apiResponse.error(res, 'Employé introuvable', 404);
        }

        // Mettre à jour les champs autorisés
        employe.nom = nom || employe.nom;
        employe.prenom = prenom || employe.prenom;
        employe.email = email || employe.email;
        employe.poste = poste || employe.poste;
        employe.departement = departement || employe.departement;
        employe.telephone = telephone || employe.telephone;
        employe.adresse = adresse || employe.adresse;
        employe.salaireBrut = salaireBrut || employe.salaireBrut;
        employe.typeContrat = typeContrat || employe.typeContrat;
        employe.statut = statut || employe.statut;

        const updatedEmploye = await employe.save();
        return apiResponse.success(res, updatedEmploye);

    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de la mise à jour', 500, err.message);
    }
};

exports.deleteEmploye = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id);
        if (!employe) {
            return apiResponse.error(res, 'Employé introuvable', 404);
        }

        employe.statut = 'INACTIF';
        await employe.save();

        return apiResponse.success(res, { message: 'Employé désactivé avec succès' });
    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de la désactivation', 500, err.message);
    }
};

exports.getStatistiquesRH = async (req, res) => {
    try {
        const totalEmployesActifs = await Employe.countDocuments({ statut: 'ACTIF' });

        const repartitionDepartement = await Employe.aggregate([
            { $match: { statut: 'ACTIF' } },
            { $group: { _id: '$departement', count: { $sum: 1 } } }
        ]);

        const repartitionContrat = await Employe.aggregate([
            { $match: { statut: 'ACTIF' } },
            { $group: { _id: '$typeContrat', count: { $sum: 1 } } }
        ]);

        const masseSalariale = await Employe.aggregate([
            { $match: { statut: 'ACTIF' } },
            { $group: { _id: null, total: { $sum: '$salaireBrut' } } }
        ]);

        const congesEnAttente = await Conge.countDocuments({ statut: 'EN_ATTENTE' });

        const stats = {
            totalEmployesActifs,
            repartitionDepartement,
            repartitionContrat,
            masseSalariale: masseSalariale.length > 0 ? masseSalariale[0].total : 0,
            congesEnAttente
        };

        return apiResponse.success(res, stats);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};


// SECTION B — Congés

exports.getConges = async (req, res) => {
    try {
        const { statut, employeId, type, page = 1, limit = 10 } = req.query;
        let query = {};

        // Si l'utilisateur n'est ni ADMIN ni RH, il ne voit que ses propres congés
        const user = await User.findById(req.user._id);
        if (user.role !== 'ADMIN' && user.role !== 'RH') {
            const employeAssocie = await Employe.findOne({ user: req.user._id });
            if (!employeAssocie) {
                return apiResponse.error(res, 'Aucun profil employé associé à cet utilisateur', 403);
            }
            query.employe = employeAssocie._id;
        } else if (employeId) {
            query.employe = employeId;
        }

        if (statut) query.statut = statut;
        if (type) query.type = type;

        const conges = await Conge.find(query)
            .populate('employe', 'nom prenom matricule')
            .sort({ dateDebut: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Conge.countDocuments(query);

        return apiResponse.paginate(res, conges, count, page, limit);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getCongeById = async (req, res) => {
    try {
        const conge = await Conge.findById(req.params.id)
            .populate('employe', 'nom prenom matricule poste')
            .populate('traitePar', 'email');
            
        if (!conge) {
            return apiResponse.error(res, 'Congé introuvable', 404);
        }
        return apiResponse.success(res, conge);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.createConge = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.error(res, 'Données invalides', 422, errors.array());
    }

    try {
        const { employeId, type, dateDebut, dateFin, motif } = req.body;

        if (new Date(dateFin) < new Date(dateDebut)) {
            return apiResponse.error(res, 'La date de fin ne peut pas être antérieure à la date de début', 400);
        }

        const nombreJours = calculerJoursOuvres(dateDebut, dateFin);
        const employe = await Employe.findById(employeId);

        if (!employe) {
            return apiResponse.error(res, 'Employé introuvable', 404);
        }

        if (type === 'ANNUEL' && employe.soldeConges < nombreJours) {
            return apiResponse.error(res, `Solde de congés insuffisant (${employe.soldeConges} jours disponibles, ${nombreJours} demandés)`, 400);
        }
        
        // Vérification de chevauchement
        const chevauchement = await Conge.findOne({
            employe: employeId,
            statut: 'APPROUVE',
            $or: [
                { dateDebut: { $lte: dateFin }, dateFin: { $gte: dateDebut } }
            ]
        });

        if (chevauchement) {
            return apiResponse.error(res, 'La demande de congé chevauche un congé déjà approuvé.', 400);
        }

        const newConge = new Conge({
            employe: employeId,
            type,
            dateDebut,
            dateFin,
            motif,
            nombreJours,
            statut: 'EN_ATTENTE'
        });

        const savedConge = await newConge.save();
        return apiResponse.created(res, savedConge);

    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de la création du congé', 500, err.message);
    }
};

exports.traiterConge = async (req, res) => {
    try {
        const { statut, commentaireRH } = req.body;
        if (!['APPROUVE', 'REFUSE'].includes(statut)) {
            return apiResponse.error(res, 'Statut invalide', 400);
        }

        const conge = await Conge.findById(req.params.id).populate('employe');
        if (!conge) {
            return apiResponse.error(res, 'Congé introuvable', 404);
        }

        if (conge.statut !== 'EN_ATTENTE') {
            return apiResponse.error(res, `Ce congé a déjà été traité (statut: ${conge.statut})`, 400);
        }

        if (statut === 'APPROUVE' && conge.type === 'ANNUEL') {
            if (conge.employe.soldeConges < conge.nombreJours) {
                return apiResponse.error(res, `Solde de congés insuffisant pour approbation.`, 400);
            }
            conge.employe.soldeConges -= conge.nombreJours;
            await conge.employe.save();
        }

        conge.statut = statut;
        conge.commentaireRH = commentaireRH;
        conge.traitePar = req.user._id;
        conge.dateTraitement = new Date();

        const updatedConge = await conge.save();
        return apiResponse.success(res, updatedConge);

    } catch (err) {
        return apiResponse.error(res, 'Erreur lors du traitement du congé', 500, err.message);
    }
};

exports.annulerConge = async (req, res) => {
    try {
        const conge = await Conge.findById(req.params.id).populate('employe');
        if (!conge) {
            return apiResponse.error(res, 'Congé introuvable', 404);
        }

        const user = await User.findById(req.user._id);
        const employeAssocie = await Employe.findOne({ user: req.user._id });

        // Un admin/RH peut annuler, ou un employé peut annuler son propre congé EN_ATTENTE
        if (user.role !== 'ADMIN' && user.role !== 'RH' && (!employeAssocie || conge.employe._id.toString() !== employeAssocie._id.toString())) {
             return apiResponse.error(res, 'Action non autorisée.', 403);
        }
        
        if (user.role !== 'ADMIN' && user.role !== 'RH' && conge.statut !== 'EN_ATTENTE') {
            return apiResponse.error(res, 'Vous ne pouvez annuler qu\'un congé en attente.', 403);
        }

        // Si le congé était approuvé, on restaure le solde
        if (conge.statut === 'APPROUVE' && conge.type === 'ANNUEL') {
            conge.employe.soldeConges += conge.nombreJours;
            await conge.employe.save();
        }

        conge.statut = 'ANNULE';
        const updatedConge = await conge.save();
        return apiResponse.success(res, updatedConge);

    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de l\'annulation', 500, err.message);
    }
};

exports.getSoldeConges = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id);
        if (!employe) {
            return apiResponse.error(res, 'Employé introuvable', 404);
        }

        const anneeEnCours = new Date().getFullYear();

        const congesApprouves = await Conge.find({
            employe: req.params.id,
            statut: 'APPROUVE',
            type: 'ANNUEL',
            dateDebut: { $gte: new Date(`${anneeEnCours}-01-01`) }
        });

        const congesEnAttente = await Conge.find({
            employe: req.params.id,
            statut: 'EN_ATTENTE',
            type: 'ANNUEL'
        });

        const totalPris = congesApprouves.reduce((acc, conge) => acc + conge.nombreJours, 0);

        return apiResponse.success(res, {
            soldeActuel: employe.soldeConges,
            congesApprouves,
            congesEnAttente,
            totalPris
        });

    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};


// SECTION C — Fiches de Paie

exports.getFichesPaie = async (req, res) => {
    try {
        const { employeId, mois, annee, page = 1, limit = 10 } = req.query;
        let query = {};

        if (employeId) query.employe = employeId;
        if (mois) query.mois = mois;
        if (annee) query.annee = annee;

        const fiches = await FichePaie.find(query)
            .populate('employe', 'nom prenom matricule poste')
            .sort({ annee: -1, mois: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await FichePaie.countDocuments(query);
        return apiResponse.paginate(res, fiches, count, page, limit);

    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.getFichePaieById = async (req, res) => {
    try {
        const fiche = await FichePaie.findById(req.params.id)
            .populate('employe')
            .populate('generePar', 'email');
        if (!fiche) {
            return apiResponse.error(res, 'Fiche de paie introuvable', 404);
        }
        return apiResponse.success(res, fiche);
    } catch (err) {
        return apiResponse.error(res, 'Erreur serveur', 500, err.message);
    }
};

exports.genererFichePaie = async (req, res) => {
    try {
        const { employeId, mois, annee } = req.body;

        const existingFiche = await FichePaie.findOne({ employe: employeId, mois, annee });
        if (existingFiche) {
            return apiResponse.error(res, 'Fiche de paie déjà générée pour cette période', 409);
        }

        const employe = await Employe.findById(employeId);
        if (!employe) {
            return apiResponse.error(res, 'Employé introuvable', 404);
        }

        const salaireBrut = employe.salaireBrut;
        const cotisationsSalariales = salaireBrut * 0.22;
        const cotisationsPatronales = salaireBrut * 0.30;
        const salaireNet = salaireBrut - cotisationsSalariales;

        const newFiche = new FichePaie({
            employe: employeId,
            mois,
            annee,
            salaireBrut,
            cotisationsSalariales,
            cotisationsPatronales,
            salaireNet,
            generePar: req.user._id
        });

        const savedFiche = await newFiche.save();
        return apiResponse.created(res, savedFiche);

    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de la génération', 500, err.message);
    }
};

exports.updateFichePaie = async (req, res) => {
    try {
        const { primes, retenues, heuresSupp } = req.body;
        const fiche = await FichePaie.findById(req.params.id);

        if (!fiche) {
            return apiResponse.error(res, 'Fiche de paie introuvable', 404);
        }

        fiche.primes = primes !== undefined ? primes : fiche.primes;
        fiche.retenues = retenues !== undefined ? retenues : fiche.retenues;
        fiche.heuresSupp = heuresSupp !== undefined ? heuresSupp : fiche.heuresSupp;

        // Recalculer le salaire net
        fiche.salaireNet = fiche.salaireBrut - fiche.cotisationsSalariales + fiche.primes - fiche.retenues;

        const updatedFiche = await fiche.save();
        return apiResponse.success(res, updatedFiche);

    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de la mise à jour', 500, err.message);
    }
};

exports.deleteFichePaie = async (req, res) => {
    try {
        const fiche = await FichePaie.findByIdAndDelete(req.params.id);
        if (!fiche) {
            return apiResponse.error(res, 'Fiche de paie introuvable', 404);
        }
        return apiResponse.success(res, { message: 'Fiche de paie supprimée avec succès' });
    } catch (err) {
        return apiResponse.error(res, 'Erreur lors de la suppression', 500, err.message);
    }
};
