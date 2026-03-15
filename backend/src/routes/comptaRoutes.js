// =============================================================
// backend/src/routes/comptaRoutes.js
// Routes module Comptabilite
// =============================================================

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const comptaController = require('../controllers/comptaController');

const router = express.Router();

// Toutes les routes comptabilite sont protegees
router.use(authMiddleware, checkRole('ADMIN', 'COMPTABLE'));

// =============================================================
// COMPTES COMPTABLES
// =============================================================
router.get('/comptes', comptaController.getComptes);
router.post('/comptes', comptaController.createCompte);
router.get('/comptes/:id', comptaController.getCompteById);
router.put('/comptes/:id', comptaController.updateCompte);
router.delete('/comptes/:id', comptaController.deleteCompte);

// =============================================================
// ECRITURES COMPTABLES
// =============================================================
router.get('/ecritures', comptaController.getEcritures);
router.post('/ecritures', comptaController.createEcriture);
router.get('/ecritures/:id', comptaController.getEcritureById);
router.put('/ecritures/:id', comptaController.updateEcriture);
router.delete('/ecritures/:id', comptaController.deleteEcriture);
router.get('/grand-livre/:compteId', comptaController.getGrandLivre);
router.get('/balance', comptaController.getBalanceGenerale);

// =============================================================
// FACTURES
// =============================================================
router.get('/factures', comptaController.getFactures);
router.post('/factures', comptaController.createFacture);
router.get('/factures/:id', comptaController.getFactureById);
router.put('/factures/:id', comptaController.updateFacture);
router.patch('/factures/:id/statut', comptaController.updateStatutFacture);
router.delete('/factures/:id', comptaController.deleteFacture);

module.exports = router;
