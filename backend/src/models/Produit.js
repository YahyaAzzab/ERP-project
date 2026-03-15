// =============================================================
// backend/src/models/Produit.js
// Mongoose Schema — Catalogue Produits (Module Stocks)
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProduitSchema = new Schema(
  {
    reference: {
      type     : String,
      required : [true, 'La référence est obligatoire'],
      unique   : true,
      trim     : true,
      uppercase: true,
      // Format suggéré : PROD-0001
    },

    designation: {
      type     : String,
      required : [true, 'La désignation est obligatoire'],
      trim     : true,
      maxlength: [150, 'Désignation trop longue'],
    },

    categorie: {
      type    : String,
      required: [true, 'La catégorie est obligatoire'],
      trim    : true,
    },

    quantiteStock: {
      type   : Number,
      default: 0,
      min    : [0, 'Le stock ne peut être négatif'],
    },

    seuilAlerte: {
      type   : Number,
      default: 5,
      min    : [0, 'Le seuil ne peut être négatif'],
    },

    prixUnitaire: {
      type    : Number,
      required: [true, 'Le prix unitaire est obligatoire'],
      min     : [0, 'Le prix ne peut être négatif'],
    },

    prixAchat: {
      type: Number,
      min : [0, 'Prix achat invalide'],
    },

    unite: {
      type   : String,
      trim   : true,
      default: 'unité', // unité, kg, litre, mètre, boîte…
    },

    description: { type: String, trim: true },

    image: { type: String }, // URL ou chemin fichier

    actif: { type: Boolean, default: true },

    // Relation vers Fournisseur principal
    fournisseur: {
      type: Schema.Types.ObjectId,
      ref : 'Fournisseur',
    },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// Virtuel : alerte si stock sous le seuil
ProduitSchema.virtual('enAlerte').get(function () {
  return this.quantiteStock <= this.seuilAlerte;
});

// Virtuel : valeur totale du stock
ProduitSchema.virtual('valeurStock').get(function () {
  return this.quantiteStock * this.prixUnitaire;
});

ProduitSchema.index({ categorie: 1 });
ProduitSchema.index({ quantiteStock: 1 });   // Pour requêtes "stock < seuil"
ProduitSchema.index({ designation: 'text', reference: 'text' });

module.exports = mongoose.model('Produit', ProduitSchema);
