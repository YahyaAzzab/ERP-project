// =============================================================
// backend/src/utils/apiResponse.js
// Helpers pour standardiser TOUTES les réponses JSON de l'API
// =============================================================
// Sans cette standardisation, chaque contrôleur inventerait son
// propre format de réponse → le frontend ne saurait pas quoi attendre.
//
// Format succès  : { success: true,  message, data }
// Format erreur  : { success: false, message, errors }
// Format paginé  : { success: true,  data, pagination: {...} }
// =============================================================

/**
 * Réponse de succès générique.
 *
 * @param {Object}  res        - Objet response Express
 * @param {*}       data       - Données à retourner (objet, tableau, null)
 * @param {string}  message    - Message lisible par le frontend
 * @param {number}  statusCode - Code HTTP (default: 200)
 */
const success = (res, data = null, message = 'Succès', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Réponse d'erreur générique.
 *
 * @param {Object}       res        - Objet response Express
 * @param {string}       message    - Message d'erreur principal
 * @param {number}       statusCode - Code HTTP (default: 400)
 * @param {Array|null}   errors     - Liste d'erreurs de validation détaillées
 */
const error = (res, message = 'Une erreur est survenue', statusCode = 400, errors = null) => {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

/**
 * Réponse paginée — pour les listes longues (GET /produits, /employes…)
 *
 * @param {Object} res
 * @param {Array}  data     - Tableau de documents
 * @param {number} total    - Total de documents dans la collection (sans filtre)
 * @param {number} page     - Page courante (1-indexed)
 * @param {number} limit    - Nombre d'éléments par page
 * @param {string} message
 */
const paginate = (res, data, total, page, limit, message = 'Succès') => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page     : Number(page),
      limit    : Number(limit),
      totalPages,
      hasNext  : page < totalPages,
      hasPrev  : page > 1,
    },
  });
};

/**
 * Réponse 201 Created — pour les créations de ressources.
 * Alias de success avec statusCode=201.
 */
const created = (res, data, message = 'Ressource créée avec succès') => {
  return success(res, data, message, 201);
};

/**
 * Réponse 204 No Content — pour les suppressions (DELETE).
 * Pas de body dans la réponse.
 */
const noContent = (res) => {
  return res.status(204).send();
};

module.exports = { success, error, paginate, created, noContent };
