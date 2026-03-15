// =============================================================
// backend/src/models/CompteComptable.js
// Mongoose Schema — Plan Comptable
// =============================================================
// Le plan comptable liste tous les comptes utilisés pour
// enregistrer les opérations financières.
// Ex : 411 = Clients, 512 = Banque, 606 = Achats fournitures
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const TYPES_COMPTE = ['ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT'];

const CompteComptableSchema = new Schema(
  {
    numero: {
      type    : String,
      required: [true, 'Le numéro de compte est obligatoire'],
      unique  : true,
      trim    : true,
      match   : [/^\d{3,6}$/, 'Le numéro doit contenir entre 3 et 6 chiffres'],
    },

    libelle: {
      type     : String,
      required : [true, 'Le libellé est obligatoire'],
      trim     : true,
      maxlength: [100, 'Libellé trop long (max 100 caractères)'],
    },

    type: {
      type    : String,
      required: [true, 'Le type de compte est obligatoire'],
      enum    : {
        values : TYPES_COMPTE,
        message: `Type invalide. Valeurs : ${TYPES_COMPTE.join(', ')}`,
      },
    },

    description: {
      type: String,
      trim: true,
    },

    actif: {
      type   : Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CompteComptableSchema.index({ type: 1 });

module.exports = mongoose.model('CompteComptable', CompteComptableSchema);
