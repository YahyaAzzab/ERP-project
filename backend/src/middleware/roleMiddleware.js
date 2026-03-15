// =============================================================
// backend/src/middleware/roleMiddleware.js
// Contrôle des autorisations par rôle (RBAC)
// =============================================================
// RBAC = Role-Based Access Control
//
// Différence fondamentale :
//   Authentification → "Qui es-tu ?"  (géré par authMiddleware)
//   Autorisation     → "Qu'as-tu le droit de faire ?" (géré ici)
//
// Ce middleware doit TOUJOURS être utilisé APRÈS authMiddleware
// car il se base sur req.user.role qui est positionné par authMiddleware.
//
// MATRICE DES DROITS (résumé) :
//   ADMIN       → accès total à tous les modules
//   COMPTABLE   → Comptabilité, lecture Dashboard
//   RH          → Module RH, lecture Dashboard
//   MAGASINIER  → Module Stocks, lecture Dashboard
// =============================================================

const { error } = require('../utils/apiResponse');

/**
 * Factory de middleware de contrôle des rôles.
 * Retourne un middleware Express qui vérifie que l'utilisateur
 * connecté possède l'un des rôles autorisés.
 *
 * @param {...string} roles - Rôles autorisés à accéder à la route
 * @returns {Function} Middleware Express
 *
 * @example
 * // Accessible uniquement par ADMIN et RH
 * router.get('/employes', authMiddleware, checkRole('ADMIN', 'RH'), employeController.getAll)
 *
 * // Accessible uniquement par ADMIN
 * router.delete('/users/:id', authMiddleware, checkRole('ADMIN'), userController.delete)
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    // req.user doit avoir été positionné par authMiddleware avant
    if (!req.user) {
      return error(
        res,
        'Non authentifié. Appelez authMiddleware avant checkRole.',
        401
      );
    }

    if (!roles.includes(req.user.role)) {
      return error(
        res,
        `Accès refusé. Rôle requis : ${roles.join(' ou ')}. Votre rôle : ${req.user.role}.`,
        403
      );
    }

    next();
  };
};

// Raccourcis pratiques pour les cas fréquents
const adminOnly        = checkRole('ADMIN');
const adminOrComptable = checkRole('ADMIN', 'COMPTABLE');
const adminOrRH        = checkRole('ADMIN', 'RH');
const adminOrMag       = checkRole('ADMIN', 'MAGASINIER');

module.exports = {
  checkRole,
  adminOnly,
  adminOrComptable,
  adminOrRH,
  adminOrMag,
};
