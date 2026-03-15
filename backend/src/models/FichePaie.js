// =============================================================
// backend/src/models/FichePaie.js
// Mongoose Schema — Fiches de Paie (Module RH)
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

// Sous-schéma pour le détail des cotisations sociales (imbriqué)
const CotisationSchema = new Schema(
  {
    libelle : { type: String, required: true, trim: true },
    tauxSalarial  : { type: Number, default: 0, min: 0 }, // % part salarié
    tauxPatronal  : { type: Number, default: 0, min: 0 }, // % part employeur
    montantSalarial: { type: Number, default: 0 },
    montantPatronal: { type: Number, default: 0 },
  },
  { _id: true }
);

const FichePaieSchema = new Schema(
  {
    // Relation vers Employe
    employe: {
      type    : Schema.Types.ObjectId,
      ref     : 'Employe',
      required: [true, "L'employé est obligatoire"],
    },

    mois: {
      type    : Number,
      required: [true, 'Le mois est obligatoire'],
      min     : [1, 'Mois invalide'],
      max     : [12, 'Mois invalide'],
    },

    annee: {
      type    : Number,
      required: [true, "L'année est obligatoire"],
      min     : [2000, 'Année invalide'],
    },

    salaireBrut: {
      type    : Number,
      required: [true, 'Le salaire brut est obligatoire'],
      min     : [0, 'Salaire invalide'],
    },

    heuresSupplementaires: {
      type   : Number,
      default: 0,
      min    : 0,
    },

    primes: {
      type   : Number,
      default: 0,
      min    : 0,
    },

    // Liste détaillée des cotisations (CNSS, AMO, IR…)
    cotisations: {
      type   : [CotisationSchema],
      default: [],
    },

    // Total des retenues salariales
    totalCotisationsSalariales: {
      type   : Number,
      default: 0,
      min    : 0,
    },

    salaireNet: {
      type    : Number,
      required: [true, 'Le salaire net est obligatoire'],
      min     : [0, 'Salaire net invalide'],
    },

    dateGeneration: {
      type   : Date,
      default: Date.now,
    },

    genereePar: {
      type: Schema.Types.ObjectId,
      ref : 'User',
    },
  },
  { timestamps: true }
);

// Index unique : un employé ne peut avoir qu'une seule fiche par mois/année
FichePaieSchema.index(
  { employe: 1, mois: 1, annee: 1 },
  { unique: true, name: 'unique_fiche_par_mois' }
);
FichePaieSchema.index({ annee: 1, mois: 1 });

module.exports = mongoose.model('FichePaie', FichePaieSchema);
