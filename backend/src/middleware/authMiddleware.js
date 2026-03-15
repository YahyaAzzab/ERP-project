// =============================================================
// backend/src/middleware/authMiddleware.js
// Vérification du token JWT sur les routes protégées
// =============================================================
// FONCTIONNEMENT :
//   1. Le client envoie : Authorization: Bearer eyJhbGci...
//   2. Ce middleware extrait le token, vérifie sa signature
//   3. Si valide → attache req.user = { _id, email, role }
//   4. Si invalide ou absent → répond avec une erreur 401
//
// Ce middleware est "stateless" : aucune requête DB nécessaire
// pour valider un JWT (la signature suffit). C'est l'un des
// avantages majeurs de JWT par rapport aux sessions serveur.
// =============================================================

const jwt         = require('jsonwebtoken');
const { error }   = require('../utils/apiResponse');

/**
 * Middleware d'authentification JWT.
 * À utiliser sur toutes les routes protégées.
 *
 * Usage : router.get('/profil', authMiddleware, controller)
 */
const authMiddleware = (req, res, next) => {
  // --- 1. Extraction du token ---
  // Convention HTTP : Authorization: Bearer <token>
  // "Bearer" signifie "le porteur du token a le droit d'accès"
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token manquant. Connectez-vous pour accéder à cette ressource.', 401);
  }

  const token = authHeader.split(' ')[1]; // Retire "Bearer "

  if (!token) {
    return error(res, 'Token manquant.', 401);
  }

  // --- 2. Vérification et décodage ---
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer  : 'erp-pme-api',
      audience: 'erp-pme-front',
    });

    // --- 3. Attache les infos utilisateur à la requête ---
    // Disponible dans tous les controllers suivants via req.user
    req.user = {
      _id  : decoded._id,
      email: decoded.email,
      role : decoded.role,
    };

    next();

  } catch (err) {
    // jwt.verify() lance différentes erreurs selon le cas
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Session expirée, reconnectez-vous.', 401);
    }

    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Token invalide.', 401);
    }

    if (err.name === 'NotBeforeError') {
      return error(res, 'Token pas encore actif.', 401);
    }

    // Erreur inattendue
    return error(res, 'Erreur d\'authentification.', 401);
  }
};

module.exports = authMiddleware;
