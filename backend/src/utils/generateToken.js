// =============================================================
// backend/src/utils/generateToken.js
// Génération de tokens JWT
// =============================================================
// JWT = JSON Web Token (RFC 7519)
// Structure : base64(header) . base64(payload) . signature
//
// - header    : algorithme de signature (HS256)
// - payload   : données publiques (id, email, role) + exp
// - signature : HMAC-SHA256(header + payload, JWT_SECRET)
//
// ⚠️  Le payload JWT est LISIBLE par n'importe qui (base64 décodable)
//     → ne jamais y mettre de données sensibles (mot de passe, carte CB)
//     → seule la SIGNATURE prouve que c'est le serveur qui l'a émis
// =============================================================

const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT signé pour un utilisateur.
 *
 * @param {Object} user - Document Mongoose User (ou objet avec _id, email, role)
 * @returns {string} Token JWT signé
 */
const generateToken = (user) => {
  const payload = {
    _id  : user._id.toString(),
    email: user.email,
    role : user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer   : 'erp-pme-api',   // Identifie qui a émis le token
    audience : 'erp-pme-front', // À qui est destiné le token
  });
};

/**
 * Décode un token JWT sans vérifier la signature.
 * Utile pour lire les données même si le token est expiré.
 * NE PAS utiliser pour l'authentification.
 *
 * @param {string} token
 * @returns {Object|null} Payload décodé ou null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

module.exports = { generateToken, decodeToken };
