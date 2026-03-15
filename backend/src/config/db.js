// =============================================================
// backend/src/config/db.js
// Connexion à MongoDB via Mongoose
// =============================================================
// Mongoose est un ODM (Object Document Mapper) : il permet de
// définir des schémas et des modèles JavaScript qui correspondent
// aux documents MongoDB, et fournit une API haut niveau pour
// les opérations CRUD (Create, Read, Update, Delete).
// =============================================================

const mongoose = require('mongoose');

/**
 * Connecte l'application à MongoDB.
 * Appelée une seule fois au démarrage du serveur (dans server.js).
 * En cas d'échec, le process est arrêté (exit 1) car l'app ne peut
 * pas fonctionner sans base de données.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Ces options ne sont plus requises depuis Mongoose 6+,
      // mais on les laisse pour la lisibilité / compatibilité
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    console.log(`   Base de données  : ${conn.connection.name}`);

  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB :', error.message);
    // Arrêt du processus Node.js — inutile de démarrer le serveur
    // si la DB est inaccessible
    process.exit(1);
  }
};

// Événements Mongoose pour surveiller la connexion en temps réel
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB déconnecté');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnecté');
});

// Fermeture propre lors d'un signal d'arrêt (CTRL+C, Docker stop…)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Connexion MongoDB fermée (arrêt de l\'application)');
  process.exit(0);
});

module.exports = connectDB;
