// =============================================================
// backend/src/models/MouvementStock.js
// Mongoose Schema — Mouvements de Stock (Module Stocks)
// =============================================================
// Chaque entrée/sortie/ajustement crée un mouvement immuable.
// La quantité du Produit est mise à jour via un hook post-save.
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const TYPES_MOUVEMENT = ['ENTREE', 'SORTIE', 'AJUSTEMENT', 'RETOUR_FOURNISSEUR', 'RETOUR_CLIENT'];

const MouvementStockSchema = new Schema(
  {
    // Relation vers Produit
    produit: {
      type    : Schema.Types.ObjectId,
      ref     : 'Produit',
      required: [true, 'Le produit est obligatoire'],
    },

    type: {
      type    : String,
      required: [true, 'Le type de mouvement est obligatoire'],
      enum    : {
        values : TYPES_MOUVEMENT,
        message: `Type invalide. Valeurs : ${TYPES_MOUVEMENT.join(', ')}`,
      },
    },

    quantite: {
      type    : Number,
      required: [true, 'La quantité est obligatoire'],
      min     : [0.01, 'La quantité doit être positive'],
    },

    // Stock avant le mouvement (snapshot pour traçabilité)
    stockAvant: {
      type: Number,
      min : 0,
    },

    // Stock après le mouvement (calculé automatiquement)
    stockApres: {
      type: Number,
      min : 0,
    },

    motif: {
      type    : String,
      required: [true, 'Le motif est obligatoire'],
      trim    : true,
    },

    date: {
      type   : Date,
      default: Date.now,
    },

    // Qui a effectué le mouvement
    effectuePar: {
      type: Schema.Types.ObjectId,
      ref : 'User',
    },

    // Référence optionnelle : numéro de bon de livraison, commande, etc.
    referenceDocument: { type: String, trim: true },

    // Lien optionnel vers Fournisseur (pour les entrées)
    fournisseur: {
      type: Schema.Types.ObjectId,
      ref : 'Fournisseur',
    },
  },
  { timestamps: true }
);

// =============================================================
// Hook post-save : mise à jour automatique du stock produit
// =============================================================
MouvementStockSchema.post('save', async function (doc) {
  const Produit = mongoose.model('Produit');
  const produit = await Produit.findById(doc.produit);
  if (!produit) return;

  const qte = doc.quantite;

  if (['ENTREE', 'RETOUR_CLIENT'].includes(doc.type)) {
    produit.quantiteStock += qte;
  } else if (['SORTIE', 'RETOUR_FOURNISSEUR'].includes(doc.type)) {
    produit.quantiteStock = Math.max(0, produit.quantiteStock - qte);
  } else if (doc.type === 'AJUSTEMENT') {
    // Pour un ajustement, la quantité représente la valeur ABSOLUE du nouveau stock
    produit.quantiteStock = qte;
  }

  await produit.save();
});

MouvementStockSchema.index({ produit: 1, date: -1 });
MouvementStockSchema.index({ type: 1 });
MouvementStockSchema.index({ date: -1 });
MouvementStockSchema.index({ effectuePar: 1 });

module.exports = mongoose.model('MouvementStock', MouvementStockSchema);
