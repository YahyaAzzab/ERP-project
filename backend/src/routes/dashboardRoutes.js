const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes les routes ici sont accessibles à n'importe quel utilisateur connecté
router.use(authMiddleware);

// KPIs
router.get('/kpis', dashboardController.getKPIsGeneraux);
router.get('/alertes', dashboardController.getAlertesDashboard);

// Graphiques Comptabilité
router.get('/graphique/ca', dashboardController.getGraphiqueCA);
router.get('/graphique/factures-statut', dashboardController.getGraphiqueFacturesParStatut);

// Graphiques RH
router.get('/graphique/employes-departement', dashboardController.getGraphiqueEmployesParDepartement);
router.get('/graphique/masse-salariale', dashboardController.getGraphiqueMasseSalariale);
router.get('/graphique/conges', dashboardController.getGraphiqueConges);

// Graphiques Stocks
router.get('/graphique/mouvements-stock', dashboardController.getGraphiqueMouvementsStock);
router.get('/graphique/stock-categorie', dashboardController.getGraphiqueStockParCategorie);

module.exports = router;
