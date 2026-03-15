// =============================================================
// backend/src/models/Facture.js
// Mongoose Schema — Factures Clients
// =============================================================
// Les lignes de facture sont des SOUS-DOCUMENTS imbriqués
// (MongoDB embedded documents) → une seule collection,
// pas de JOIN, lecture atomique de toute la facture.
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const STATUTS = ['BROUILLON', 'VALIDEE', 'PAYEE', 'ANNULEE'];

// --- Sous-schéma ligne de facture (imbriqué) ---
const LigneFactureSchema = new Schema(
  {
    designation : { type: String, required: true, trim: true },
    quantite    : { type: Number, required: true, min: [0.01, 'Quantité invalide'] },
    prixUnitaire: { type: Number, required: true, min: [0, 'Prix invalide'] },
    tvaPercent  : { type: Number, default: 20, min: 0, max: 100 },
    produit     : { type: Schema.Types.ObjectId, ref: 'Produit' }, // lien catalogue
  },
  { _id: true }
);

const FactureSchema = new Schema(
  {
    numero: {
      type    : String,
      required: [true, 'Le numéro de facture est obligatoire'],
      unique  : true,
      trim    : true,
    },

    date        : { type: Date, default: Date.now },
    dateEcheance: { type: Date },

    // Données client dénormalisées (pour conserver l'historique si le client change)
    clientNom    : { type: String, required: [true, 'Nom client obligatoire'], trim: true },
    clientEmail  : { type: String, trim: true, lowercase: true },
    clientAdresse: { type: String, trim: true },

    lignes: {
      type    : [LigneFactureSchema],
      validate: {
        validator: (v) => v.length > 0,
        message  : 'Une facture doit contenir au moins une ligne',
      },
    },

    // Calculés automatiquement dans le hook pre-save
    montantHT : { type: Number, min: 0 },
    tva       : { type: Number, min: 0 },
    montantTTC: { type: Number, min: 0 },

    statut: {
      type   : String,
      enum   : { values: STATUTS, message: `Statut invalide. Valeurs : ${STATUTS.join(', ')}` },
      default: 'BROUILLON',
    },

    notes: { type: String, trim: true },

    // Écritures comptables générées à la validation de la facture
    ecrituresComptables: [{ type: Schema.Types.ObjectId, ref: 'EcritureComptable' }],

    creePar: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// --- Hook pre-save : calcul automatique des totaux ---
FactureSchema.pre('save', function (next) {
  if (this.lignes && this.lignes.length > 0) {
    this.montantHT = this.lignes.reduce(
      (sum, l) => sum + l.quantite * l.prixUnitaire, 0
    );
    this.tva = this.lignes.reduce(
      (sum, l) => sum + l.quantite * l.prixUnitaire * (l.tvaPercent / 100), 0
    );
    this.montantTTC = this.montantHT + this.tva;
  }
  next();
});

FactureSchema.index({ statut: 1 });
FactureSchema.index({ date: -1 });
FactureSchema.index({ clientNom: 'text' });

module.exports = mongoose.model('Facture', FactureSchema);
