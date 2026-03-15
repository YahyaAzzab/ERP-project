// =============================================================
// backend/src/routes/authRoutes.js
// Routes d'authentification avec validation express-validator
// =============================================================

const express        = require('express');
const { body }       = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// =============================================================
// RÈGLES DE VALIDATION — réutilisables
// =============================================================

const registerValidation = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ max: 50 }).withMessage('Le nom ne doit pas dépasser 50 caractères'),

  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prénom est obligatoire')
    .isLength({ max: 50 }).withMessage('Le prénom ne doit pas dépasser 50 caractères'),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire")
    .isEmail().withMessage("Format d'email invalide")
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins 1 lettre majuscule')
    .matches(/[0-9]/).withMessage('Au moins 1 chiffre'),

  body('role')
    .optional()
    .isIn(['ADMIN', 'COMPTABLE', 'RH', 'MAGASINIER'])
    .withMessage("Rôle invalide. Valeurs : ADMIN, COMPTABLE, RH, MAGASINIER"),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire")
    .isEmail().withMessage("Format d'email invalide")
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire'),
];

const updatePasswordValidation = [
  body('ancienPassword')
    .notEmpty().withMessage("L'ancien mot de passe est obligatoire"),

  body('nouveauPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins 1 lettre majuscule')
    .matches(/[0-9]/).withMessage('Au moins 1 chiffre'),
];

// =============================================================
// DÉFINITION DES ROUTES
// =============================================================

/**
 * @route   POST /api/auth/register
 * @desc    Créer un nouveau compte utilisateur
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion — retourne un token JWT
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Privé (JWT requis)
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @route   PUT /api/auth/password
 * @desc    Changer son mot de passe
 * @access  Privé (JWT requis)
 */
router.put('/password', authMiddleware, updatePasswordValidation, authController.updatePassword);

module.exports = router;
