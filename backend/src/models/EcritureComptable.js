// =============================================================
// backend/src/models/EcritureComptable.js
// Mongoose Schema — Journal Comptable (partie double)
// =============================================================
// Principe de la partie double : tout débit a un crédit égal.
// Chaque écriture lie un montant à un compte comptable.
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const JOURNAUX = ['GENERAL', 'VENTES', 'ACHATS', 'BANQUE', 'CAISSE', 'OD'];

const EcritureComptableSchema = new Schema(
  {
    date: {
      type    : Date,
      required: [true, "La date est obligatoire"],
      default : Date.now,
    },

    libelle: {
      type     : String,
      required : [true, 'Le libellé est obligatoire'],
      trim     : true,
      maxlength: [200, 'Libellé trop long'],
    },

    montantDebit: {
      type   : Number,
      default: 0,
      min    : [0, 'Le montant débit ne peut être négatif'],
    },

    montantCredit: {
      type   : Number,
      default: 0,
      min    : [0, 'Le montant crédit ne peut être négatif'],
    },

    // Relation vers CompteComptable
    compte: {
      type    : Schema.Types.ObjectId,
      ref     : 'CompteComptable',
      required: [true, 'Le compte comptable est obligatoire'],
    },

    // Relation optionnelle vers Facture
    facture: {
      type: Schema.Types.ObjectId,
      ref : 'Facture',
    },

    saisiePar: {
      type: Schema.Types.ObjectId,
      ref : 'User',
    },

    journal: {
      type     : String,
      default  : 'GENERAL',
      uppercase: true,
      enum     : {
        values : JOURNAUX,
        message: `Journal invalide. Valeurs : ${JOURNAUX.join(', ')}`,
      },
    },

    reference: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

EcritureComptableSchema.index({ compte: 1, date: -1 });
EcritureComptableSchema.index({ facture: 1 });
EcritureComptableSchema.index({ date: -1 });
EcritureComptableSchema.index({ journal: 1, date: -1 });

module.exports = mongoose.model('EcritureComptable', EcritureComptableSchema);
