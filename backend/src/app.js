// =============================================================
// backend/src/app.js
// Configuration de l'application Express (sans démarrage serveur)
// =============================================================
// Séparer app.js de server.js est une bonne pratique :
//   - app.js  → configure les middlewares, routes, gestion d'erreurs
//   - server.js → connecte la DB et lance le serveur HTTP
// Cela facilite les tests unitaires (on importe app sans démarrer
// un vrai serveur réseau).
// =============================================================

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

// Routes
const authRoutes = require('./routes/authRoutes');
const comptaRoutes = require('./routes/comptaRoutes');
const rhRoutes = require('./routes/rhRoutes');
const stocksRoutes = require('./routes/stocksRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// =============================================================
// MIDDLEWARES GLOBAUX
// =============================================================

/**
 * helmet() — Sécurité HTTP
 * Positionne automatiquement une dizaine d'en-têtes HTTP sécuritaires :
 *   - Content-Security-Policy (protection XSS)
 *   - X-Frame-Options (protection clickjacking)
 *   - Strict-Transport-Security (force HTTPS)
 *   - X-Content-Type-Options (empêche MIME-sniffing)
 *   … et bien d'autres.
 * À activer en premier pour protéger TOUTES les réponses.
 */
app.use(helmet());

/**
 * cors() — Cross-Origin Resource Sharing
 * Permet au frontend React (ex: http://localhost:3000) d'appeler
 * le backend (ex: http://localhost:5000) même s'ils sont sur des
 * origines différentes. Sans cors, le navigateur bloque les requêtes.
 */
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL   // URL de prod (à définir dans .env)
    : ['http://localhost:3000', 'http://localhost:3001'], // URLs de dev React
  credentials: true,             // Autorise les cookies / Authorization header
}));

/**
 * morgan('dev') — Logging HTTP
 * Affiche dans le terminal chaque requête reçue avec :
 *   méthode, URL, code de statut, temps de réponse, taille de la réponse
 * Exemple : GET /api/health 200 4.321 ms - 44
 * Indispensable pour déboguer pendant le développement.
 */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

/**
 * express.json() — Parsing du body JSON
 * Permet de lire req.body lorsque le client envoie du JSON
 * (Content-Type: application/json). Sans cela, req.body est undefined.
 */
app.use(express.json({ limit: '10mb' }));

/**
 * express.urlencoded() — Parsing des formulaires HTML classiques
 * Utile si certains clients envoient des données en form-urlencoded.
 */
app.use(express.urlencoded({ extended: true }));

// =============================================================
// ROUTES
// =============================================================

/**
 * Route de santé — GET /api/health
 * Permet de vérifier rapidement que le serveur tourne.
 * Utile pour les healthchecks Docker / Kubernetes / load balancer.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status : 'OK',
    message: 'ERP API running',
    environment: process.env.NODE_ENV,
    timestamp  : new Date().toISOString(),
  });
});

// ---
// Routes métier montées ici
app.use('/api/auth',         authRoutes);
app.use('/api/comptabilite', comptaRoutes);
app.use('/api/rh',           rhRoutes);
app.use('/api/stocks',       stocksRoutes);
app.use('/api/dashboard',    dashboardRoutes);
// ---

// =============================================================
// MIDDLEWARE DE GESTION D'ERREURS GLOBAL
// =============================================================
// Doit toujours être déclaré EN DERNIER, après toutes les routes.
// Express reconnaît un gestionnaire d'erreurs à ses 4 paramètres :
// (err, req, res, next).

// Route inconnue (404)
app.use((req, res, next) => {
  const error = new Error(`Route introuvable : ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Gestionnaire d'erreurs central
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Erreur interne du serveur';

  // En développement, on renvoie la stack trace pour déboguer facilement
  const response = {
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  console.error(`❌ [${statusCode}] ${message}`);
  res.status(statusCode).json(response);
});

module.exports = app;
