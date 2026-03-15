const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const stocksController = require('../controllers/stocksController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const checkRole = roleMiddleware.checkRole;
const checkAdmin = roleMiddleware.checkRole('ADMIN');
const checkMagasinier = roleMiddleware.checkRole('ADMIN', 'MAGASINIER');

// --- Routes Fournisseurs ---
router.get('/fournisseurs', authMiddleware, checkMagasinier, stocksController.getFournisseurs);
router.post('/fournisseurs', 
    authMiddleware, 
    checkMagasinier,
    [ body('nom').notEmpty().withMessage('Le nom du fournisseur est requis') ],
    stocksController.createFournisseur
);
router.get('/fournisseurs/:id', authMiddleware, checkMagasinier, stocksController.getFournisseurById);
router.put('/fournisseurs/:id', authMiddleware, checkMagasinier, stocksController.updateFournisseur);
router.delete('/fournisseurs/:id', authMiddleware, checkAdmin, stocksController.deleteFournisseur);

// --- Routes Produits ---
router.get('/produits', authMiddleware, checkMagasinier, stocksController.getProduits);
router.post('/produits', 
    authMiddleware, 
    checkMagasinier,
    [
        body('designation').notEmpty().withMessage('La désignation est requise'),
        body('categorie').notEmpty().withMessage('La catégorie est requise'),
        body('prixUnitaire').isFloat({ gt: 0 }).withMessage('Le prix unitaire est requis et doit être positif'),
    ],
    stocksController.createProduit
);
router.get('/produits/alertes', authMiddleware, checkMagasinier, stocksController.getProduitsEnAlerte);
router.get('/produits/categories', authMiddleware, checkMagasinier, stocksController.getCategories);
router.get('/produits/:id', authMiddleware, checkMagasinier, stocksController.getProduitById);
router.put('/produits/:id', authMiddleware, checkMagasinier, stocksController.updateProduit);
router.delete('/produits/:id', authMiddleware, checkAdmin, stocksController.deleteProduit);

// --- Routes Mouvements ---
router.get('/mouvements', authMiddleware, checkMagasinier, stocksController.getMouvements);
router.get('/mouvements/:id', authMiddleware, checkMagasinier, stocksController.getMouvementById);
router.post('/mouvements/entree', 
    authMiddleware, 
    checkMagasinier,
    [
        body('produitId').notEmpty().withMessage('L\'ID du produit est requis'),
        body('quantite').isInt({ gt: 0 }).withMessage('La quantité doit être un entier positif'),
        body('motif').notEmpty().withMessage('Le motif est requis'),
    ],
    stocksController.entreeStock
);
router.post('/mouvements/sortie', 
    authMiddleware, 
    checkMagasinier,
    [
        body('produitId').notEmpty().withMessage('L\'ID du produit est requis'),
        body('quantite').isInt({ gt: 0 }).withMessage('La quantité doit être un entier positif'),
        body('motif').notEmpty().withMessage('Le motif est requis'),
    ],
    stocksController.sortieStock
);
router.post('/mouvements/ajustement', 
    authMiddleware, 
    checkMagasinier,
    [
        body('produitId').notEmpty().withMessage('L\'ID du produit est requis'),
        body('nouvelleQuantite').isInt({ gte: 0 }).withMessage('La nouvelle quantité doit être un entier positif ou nul'),
        body('motif').notEmpty().withMessage('Le motif est requis'),
    ],
    stocksController.ajustementStock
);

// --- Routes Inventaire & Statistiques ---
router.get('/inventaire', authMiddleware, checkMagasinier, stocksController.getInventaire);
router.get('/statistiques', authMiddleware, checkMagasinier, stocksController.getStatistiquesStocks);

module.exports = router;
