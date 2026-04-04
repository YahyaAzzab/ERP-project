// =============================================================
// backend/src/controllers/authController.js
// Logique métier — Authentification & Gestion des comptes
// =============================================================

const { validationResult } = require('express-validator');
const User                 = require('../models/User');
const { generateToken }    = require('../utils/generateToken');
const { success, error, created, paginate } = require('../utils/apiResponse');
const mongoose = require('mongoose');

// =============================================================
// HELPER — formate un User pour la réponse (sans password)
// =============================================================
// On ne retourne JAMAIS le hash du mot de passe dans une réponse.
// Même hashé, l'exposer facilite les attaques par dictionnaire
// hors-ligne (l'attaquant peut bruteforcer localement sans limite).
const formatUser = (user) => ({
  _id      : user._id,
  nom      : user.nom,
  prenom   : user.prenom,
  email    : user.email,
  role     : user.role,
  actif    : user.actif,
  dernierLogin: user.dernierLogin,
  createdAt: user.createdAt,
});

// =============================================================
// POST /api/auth/register
// =============================================================
const register = async (req, res) => {
  try {
    // --- 1. Validation express-validator ---
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return error(
        res,
        'Données invalides',
        422,
        validationErrors.array().map((e) => ({ champ: e.path, message: e.msg }))
      );
    }

    const { nom, prenom, email, password, role } = req.body;

    // --- 2. Email déjà utilisé ? ---
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return error(res, 'Un compte existe déjà avec cet email.', 409);
    }

    // --- 3. Création du User ---
    // Le hook pre-save de Mongoose hashera le password automatiquement
    const user = await User.create({ nom, prenom, email, password, role });

    // --- 4. Génération du token JWT ---
    const token = generateToken(user);

    // --- 5. Mise à jour du dernier login ---
    user.dernierLogin = new Date();
    await user.save();

    return created(res, { user: formatUser(user), token }, 'Compte créé avec succès');

  } catch (err) {
    // Erreur de duplicate index MongoDB (E11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return error(res, `La valeur du champ "${field}" est déjà utilisée.`, 409);
    }

    console.error('[authController.register]', err.message);
    return error(res, 'Erreur serveur lors de la création du compte.', 500);
  }
};

// =============================================================
// POST /api/auth/login
// =============================================================
const login = async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return error(
        res,
        'Données invalides',
        422,
        validationErrors.array().map((e) => ({ champ: e.path, message: e.msg }))
      );
    }

    const { email, password } = req.body;

    // --- 1. Cherche l'utilisateur ---
    // .select('+password') est obligatoire car le champ password
    // a select:false dans le schéma → il n'est jamais renvoyé par défaut
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password');

    if (!user) {
      // Message volontairement vague → ne pas révéler si l'email existe
      return error(res, 'Email ou mot de passe incorrect.', 401);
    }

    // --- 2. Compte actif ? ---
    if (!user.actif) {
      return error(res, 'Compte désactivé. Contactez votre administrateur.', 403);
    }

    // --- 3. Vérification du mot de passe ---
    const isPasswordValid = await user.verifierPassword(password);
    if (!isPasswordValid) {
      return error(res, 'Email ou mot de passe incorrect.', 401);
    }

    // --- 4. Mise à jour du dernier login ---
    user.dernierLogin = new Date();
    await user.save();

    // --- 5. Génération du token ---
    const token = generateToken(user);

    return success(
      res,
      { user: formatUser(user), token },
      'Connexion réussie'
    );

  } catch (err) {
    console.error('[authController.login]', err.message);
    return error(res, 'Erreur serveur lors de la connexion.', 500);
  }
};

// =============================================================
// GET /api/auth/me  (route protégée — authMiddleware requis)
// =============================================================
const me = async (req, res) => {
  try {
    // req.user._id est positionné par authMiddleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return error(res, 'Utilisateur introuvable.', 404);
    }

    if (!user.actif) {
      return error(res, 'Compte désactivé.', 403);
    }

    return success(res, { user: formatUser(user) }, 'Profil récupéré avec succès');

  } catch (err) {
    console.error('[authController.me]', err.message);
    return error(res, 'Erreur serveur.', 500);
  }
};

// =============================================================
// ADMIN — GET /api/auth/users
// =============================================================
const getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const { search, role, actif } = req.query;
    const query = {};

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ nom: regex }, { prenom: regex }, { email: regex }];
    }

    if (role && ['ADMIN', 'COMPTABLE', 'RH', 'MAGASINIER'].includes(String(role).toUpperCase())) {
      query.role = String(role).toUpperCase();
    }

    if (typeof actif === 'string') {
      if (actif.toLowerCase() === 'true') query.actif = true;
      if (actif.toLowerCase() === 'false') query.actif = false;
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return paginate(res, { users: users.map(formatUser) }, total, page, limit, 'Utilisateurs recuperes avec succes');
  } catch (err) {
    console.error('[authController.getUsers]', err.message);
    return error(res, 'Erreur serveur lors de la recuperation des utilisateurs.', 500);
  }
};

// =============================================================
// ADMIN — POST /api/auth/users
// =============================================================
const createUserByAdmin = async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return error(
        res,
        'Donnees invalides',
        422,
        validationErrors.array().map((e) => ({ champ: e.path, message: e.msg }))
      );
    }

    const { nom, prenom, email, password, role, actif } = req.body;

    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return error(res, 'Un compte existe deja avec cet email.', 409);
    }

    const user = await User.create({
      nom,
      prenom,
      email,
      password,
      role,
      actif: actif !== false,
    });

    return created(res, { user: formatUser(user) }, 'Profil utilisateur cree avec succes');
  } catch (err) {
    if (err.code === 11000) {
      return error(res, 'Email deja utilise.', 409);
    }
    console.error('[authController.createUserByAdmin]', err.message);
    return error(res, 'Erreur serveur lors de la creation du profil.', 500);
  }
};

// =============================================================
// ADMIN — PUT /api/auth/users/:id
// =============================================================
const updateUserByAdmin = async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return error(
        res,
        'Donnees invalides',
        422,
        validationErrors.array().map((e) => ({ champ: e.path, message: e.msg }))
      );
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return error(res, 'ID utilisateur invalide.', 400);
    }

    const user = await User.findById(id);
    if (!user) return error(res, 'Utilisateur introuvable.', 404);

    const updates = {};
    if (typeof req.body.nom === 'string') updates.nom = req.body.nom;
    if (typeof req.body.prenom === 'string') updates.prenom = req.body.prenom;
    if (typeof req.body.email === 'string') updates.email = req.body.email;
    if (typeof req.body.role === 'string') updates.role = req.body.role;
    if (typeof req.body.actif === 'boolean') updates.actif = req.body.actif;

    if (updates.email) {
      const alreadyUsed = await User.findOne({
        email: String(updates.email).toLowerCase().trim(),
        _id: { $ne: user._id },
      });
      if (alreadyUsed) {
        return error(res, 'Cet email est deja utilise.', 409);
      }
    }

    Object.assign(user, updates);
    await user.save();

    return success(res, { user: formatUser(user) }, 'Profil utilisateur mis a jour avec succes');
  } catch (err) {
    console.error('[authController.updateUserByAdmin]', err.message);
    return error(res, 'Erreur serveur lors de la mise a jour du profil.', 500);
  }
};

// =============================================================
// ADMIN — PUT /api/auth/users/:id/password
// =============================================================
const resetUserPasswordByAdmin = async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return error(
        res,
        'Donnees invalides',
        422,
        validationErrors.array().map((e) => ({ champ: e.path, message: e.msg }))
      );
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return error(res, 'ID utilisateur invalide.', 400);
    }

    const user = await User.findById(id).select('+password');
    if (!user) return error(res, 'Utilisateur introuvable.', 404);

    user.password = req.body.nouveauPassword;
    await user.save();

    return success(res, null, 'Mot de passe reinitialise avec succes');
  } catch (err) {
    console.error('[authController.resetUserPasswordByAdmin]', err.message);
    return error(res, 'Erreur serveur lors de la reinitialisation du mot de passe.', 500);
  }
};

// =============================================================
// ADMIN — DELETE /api/auth/users/:id
// =============================================================
const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return error(res, 'ID utilisateur invalide.', 400);
    }

    if (String(req.user._id) === String(id)) {
      return error(res, 'Vous ne pouvez pas supprimer votre propre profil.', 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return error(res, 'Utilisateur introuvable.', 404);

    return success(res, null, 'Profil utilisateur supprime avec succes');
  } catch (err) {
    console.error('[authController.deleteUserByAdmin]', err.message);
    return error(res, 'Erreur serveur lors de la suppression du profil.', 500);
  }
};

// =============================================================
// PUT /api/auth/password  (route protégée — authMiddleware requis)
// =============================================================
const updatePassword = async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return error(
        res,
        'Données invalides',
        422,
        validationErrors.array().map((e) => ({ champ: e.path, message: e.msg }))
      );
    }

    const { ancienPassword, nouveauPassword } = req.body;

    // Chercher le user avec son password (caché par défaut)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return error(res, 'Utilisateur introuvable.', 404);
    }

    // Vérifier l'ancien mot de passe
    const isValid = await user.verifierPassword(ancienPassword);
    if (!isValid) {
      return error(res, 'Ancien mot de passe incorrect.', 401);
    }

    // Le nouveau ne peut pas être identique à l'ancien
    const isSame = await user.verifierPassword(nouveauPassword);
    if (isSame) {
      return error(res, 'Le nouveau mot de passe doit être différent de l\'ancien.', 400);
    }

    // Assigner le nouveau → le hook pre-save re-hashera automatiquement
    user.password = nouveauPassword;
    await user.save();

    // Générer un nouveau token (l'ancien reste valide jusqu'à expiration,
    // mais on retourne un nouveau pour que le client le remplace)
    const newToken = generateToken(user);

    return success(
      res,
      { token: newToken },
      'Mot de passe mis à jour avec succès'
    );

  } catch (err) {
    console.error('[authController.updatePassword]', err.message);
    return error(res, 'Erreur serveur.', 500);
  }
};

module.exports = {
  register,
  login,
  me,
  updatePassword,
  getUsers,
  createUserByAdmin,
  updateUserByAdmin,
  resetUserPasswordByAdmin,
  deleteUserByAdmin,
};
