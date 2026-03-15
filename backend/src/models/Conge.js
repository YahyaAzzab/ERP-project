// =============================================================
// backend/src/models/Conge.js
// Mongoose Schema — Demandes de Congé (Module RH)
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const TYPES_CONGE  = ['ANNUEL', 'MALADIE', 'SANS_SOLDE', 'MATERNITE', 'PATERNITE', 'EXCEPTIONNEL'];
const STATUTS_CONGE = ['EN_ATTENTE', 'APPROUVE', 'REFUSE', 'ANNULE'];

const CongeSchema = new Schema(
  {
    // Relation vers Employe (obligatoire)
    employe: {
      type    : Schema.Types.ObjectId,
      ref     : 'Employe',
      required: [true, "L'employé est obligatoire"],
    },

    type: {
      type    : String,
      required: [true, 'Le type de congé est obligatoire'],
      enum    : {
        values : TYPES_CONGE,
        message: `Type invalide. Valeurs : ${TYPES_CONGE.join(', ')}`,
      },
    },

    dateDebut: {
      type    : Date,
      required: [true, 'La date de début est obligatoire'],
    },

    dateFin: {
      type    : Date,
      required: [true, 'La date de fin est obligatoire'],
    },

    statut: {
      type   : String,
      enum   : {
        values : STATUTS_CONGE,
        message: `Statut invalide. Valeurs : ${STATUTS_CONGE.join(', ')}`,
      },
      default: 'EN_ATTENTE',
    },

    motif: {
      type: String,
      trim: true,
    },

    commentaireRH: {
      type: String,
      trim: true,
    },

    // Qui a approuvé/refusé la demande
    traitePar: {
      type: Schema.Types.ObjectId,
      ref : 'User',
    },

    dateTraitement: { type: Date },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// Virtuel : nombre de jours ouvrés
CongeSchema.virtual('nombreJours').get(function () {
  if (!this.dateDebut || !this.dateFin) return 0;
  const ms   = new Date(this.dateFin) - new Date(this.dateDebut);
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
  return days;
});

// Validation : dateFin >= dateDebut
CongeSchema.pre('save', function (next) {
  if (this.dateFin < this.dateDebut) {
    return next(new Error('La date de fin doit être après la date de début'));
  }
  next();
});

CongeSchema.index({ employe: 1, dateDebut: -1 });
CongeSchema.index({ statut: 1 });
CongeSchema.index({ dateDebut: 1, dateFin: 1 });

module.exports = mongoose.model('Conge', CongeSchema);
