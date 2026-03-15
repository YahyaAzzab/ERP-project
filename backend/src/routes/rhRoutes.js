const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rhController = require('../controllers/rhController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const checkRole = roleMiddleware.checkRole;

// --- Routes Employés ---
router.get('/employes', authMiddleware, checkRole('ADMIN', 'RH'), rhController.getEmployes);
router.post('/employes', 
    authMiddleware, 
    checkRole('ADMIN', 'RH'),
    [
        body('nom').notEmpty().withMessage('Le nom est requis'),
        body('prenom').notEmpty().withMessage('Le prénom est requis'),
        body('email').isEmail().withMessage('Un email valide est requis'),
        body('poste').notEmpty().withMessage('Le poste est requis'),
        body('departement').notEmpty().withMessage('Le département est requis'),
        body('dateEmbauche').isISO8601().withMessage('La date d\'embauche est requise'),
        body('salaireBrut').isNumeric().withMessage('Le salaire brut est requis et doit être un nombre'),
    ],
    rhController.createEmploye
);
router.get('/employes/statistiques', authMiddleware, checkRole('ADMIN', 'RH'), rhController.getStatistiquesRH);
router.get('/employes/:id', authMiddleware, checkRole('ADMIN', 'RH'), rhController.getEmployeById);
router.put('/employes/:id', authMiddleware, checkRole('ADMIN', 'RH'), rhController.updateEmploye);
router.delete('/employes/:id', authMiddleware, checkRole('ADMIN', 'RH'), rhController.deleteEmploye);


// --- Routes Congés ---
router.get('/conges', authMiddleware, rhController.getConges);
router.post('/conges', 
    authMiddleware,
    [
        body('employeId').notEmpty().withMessage('L\'ID de l\'employé est requis'),
        body('type').isIn(['ANNUEL', 'MALADIE', 'SANS_SOLDE', 'MATERNITE', 'PATERNITE']).withMessage('Type de congé invalide'),
        body('dateDebut').isISO8601().withMessage('La date de début est requise'),
        body('dateFin').isISO8601().withMessage('La date de fin est requise'),
    ],
    rhController.createConge
);
router.get('/conges/:id', authMiddleware, rhController.getCongeById);
router.put('/conges/:id/traiter', authMiddleware, checkRole('ADMIN', 'RH'), rhController.traiterConge);
router.put('/conges/:id/annuler', authMiddleware, rhController.annulerConge);
router.get('/employes/:id/solde-conges', authMiddleware, checkRole('ADMIN', 'RH'), rhController.getSoldeConges);


// --- Routes Fiches de Paie ---
router.get('/fiches-paie', authMiddleware, checkRole('ADMIN', 'RH'), rhController.getFichesPaie);
router.post('/fiches-paie', 
    authMiddleware, 
    checkRole('ADMIN', 'RH'),
    [
        body('employeId').notEmpty().withMessage('L\'ID de l\'employé est requis'),
        body('mois').isInt({ min: 1, max: 12 }).withMessage('Le mois est invalide'),
        body('annee').isInt({ min: 2000 }).withMessage('L\'année est invalide'),
    ],
    rhController.genererFichePaie
);
router.get('/fiches-paie/:id', authMiddleware, checkRole('ADMIN', 'RH'), rhController.getFichePaieById);
router.put('/fiches-paie/:id', authMiddleware, checkRole('ADMIN', 'RH'), rhController.updateFichePaie);
router.delete('/fiches-paie/:id', authMiddleware, checkRole('ADMIN', 'RH'), rhController.deleteFichePaie);


module.exports = router;
