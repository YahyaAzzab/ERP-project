// =============================================================
// backend/src/server.js
// Point d'entrée de l'application — démarrage du serveur HTTP
// =============================================================
// Rôle unique de ce fichier :
//   1. Charger les variables d'environnement (.env)
//   2. Connecter la base de données MongoDB
//   3. Démarrer le serveur Express sur le bon PORT
//
// Pourquoi séparer server.js et app.js ?
//   → app.js exporte l'instance Express pure (testable sans réseau)
//   → server.js est le "point d'entrée" qui orchestre le démarrage
//   → Pour les tests Jest/Supertest, on importe app.js directement
//      sans ouvrir de socket TCP.
// =============================================================

// Charger les variables d'environnement EN PREMIER
// (avant tout autre require qui pourrait en avoir besoin)
require('dotenv').config();

const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Démarrage asynchrone : on attend la connexion DB avant le listen
const startServer = async () => {
  try {
    // 1. Connexion à MongoDB
    await connectDB();

    // 2. Démarrage du serveur HTTP
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ============================================');
      console.log(`   ERP PME — Serveur démarré`);
      console.log(`   URL     : http://localhost:${PORT}`);
      console.log(`   Health  : http://localhost:${PORT}/api/health`);
      console.log(`   Mode    : ${process.env.NODE_ENV}`);
      console.log('================================================');
      console.log('');
    });

    // Gestion des erreurs serveur non catchées
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} déjà utilisé. Choisissez un autre PORT dans .env`);
      } else {
        console.error('❌ Erreur serveur :', err.message);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Échec du démarrage :', error.message);
    process.exit(1);
  }
};

// Gestion des exceptions non catchées (filet de sécurité global)
process.on('uncaughtException', (err) => {
  console.error('💥 uncaughtException :', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 unhandledRejection :', reason);
  process.exit(1);
});

startServer();
