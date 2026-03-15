// =============================================================
// backend/src/models/Fournisseur.js
// Mongoose Schema — Fournisseurs (Module Stocks)
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const FournisseurSchema = new Schema(
  {
    nom: {
      type     : String,
      required : [true, 'Le nom est obligatoire'],
      trim     : true,
      maxlength: [100, 'Nom trop long'],
    },

    email: {
      type     : String,
      trim     : true,
      lowercase: true,
      match    : [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
    },

    telephone: { type: String, trim: true },

    adresse: {
      rue     : { type: String, trim: true },
      ville   : { type: String, trim: true },
      codePostal: { type: String, trim: true },
      pays    : { type: String, trim: true, default: 'Maroc' },
    },

    // Identifiant fiscal du fournisseur
    ice      : { type: String, trim: true }, // ICE Maroc
    raisonSociale: { type: String, trim: true },

    actif: { type: Boolean, default: true },

    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// Virtuel : liste des produits fournis (référence inverse)
// On accède aux produits via Produit.find({ fournisseur: id })
// au lieu d'un tableau d'IDs ici (évite les tableaux trop grands)

FournisseurSchema.index({ nom: 'text' });
FournisseurSchema.index({ actif: 1 });

module.exports = mongoose.model('Fournisseur', FournisseurSchema);
