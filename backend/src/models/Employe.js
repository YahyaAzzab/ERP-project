// =============================================================
// backend/src/models/Employe.js
// Mongoose Schema — Fiche Employé (Module RH)
// =============================================================

const mongoose = require('mongoose');

const { Schema } = mongoose;

const STATUTS = ['ACTIF', 'INACTIF', 'CONGE', 'SUSPENDU'];
const TYPES_CONTRAT = ['CDI', 'CDD', 'STAGE'];

const EmployeSchema = new Schema(
  {
    matricule: {
      type    : String,
      required: [true, 'Le matricule est obligatoire'],
      unique  : true,
      trim    : true,
      uppercase: true,
      // Format suggéré : EMP-0001
    },

    nom: {
      type     : String,
      required : [true, 'Le nom est obligatoire'],
      trim     : true,
      maxlength: [50, 'Nom trop long'],
    },

    prenom: {
      type     : String,
      required : [true, 'Le prénom est obligatoire'],
      trim     : true,
      maxlength: [50, 'Prénom trop long'],
    },

    email: {
      type     : String,
      required : [true, "L'email est obligatoire"],
      unique   : true,
      lowercase: true,
      trim     : true,
      match    : [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
    },

    telephone: { type: String, trim: true },

    poste: {
      type    : String,
      required: [true, 'Le poste est obligatoire'],
      trim    : true,
    },

    departement: {
      type    : String,
      required: [true, 'Le département est obligatoire'],
      trim    : true,
    },

    dateEmbauche: {
      type    : Date,
      required: [true, "La date d'embauche est obligatoire"],
    },

    salaireBrut: {
      type    : Number,
      required: [true, 'Le salaire brut est obligatoire'],
      min     : [0, 'Le salaire ne peut être négatif'],
    },

    typeContrat: {
      type   : String,
      enum   : { values: TYPES_CONTRAT, message: `Type de contrat invalide. Valeurs : ${TYPES_CONTRAT.join(', ')}` },
      default: 'CDI',
    },

    soldeConges: {
      type   : Number,
      default: 18,
      min    : [0, 'Le solde de conges ne peut etre negatif'],
    },

    statut: {
      type   : String,
      enum   : { values: STATUTS, message: `Statut invalide. Valeurs : ${STATUTS.join(', ')}` },
      default: 'ACTIF',
    },

    adresse   : { type: String, trim: true },
    dateNaiss : { type: Date },
    cin       : { type: String, trim: true }, // Carte d'identité nationale

    // Lien vers le compte utilisateur ERP (optionnel)
    user: {
      type: Schema.Types.ObjectId,
      ref : 'User',
    },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

EmployeSchema.virtual('nomComplet').get(function () {
  return `${this.prenom} ${this.nom}`;
});

// Calcul de l'ancienneté en années
EmployeSchema.virtual('anciennete').get(function () {
  if (!this.dateEmbauche) return 0;
  const ms    = Date.now() - new Date(this.dateEmbauche).getTime();
  const years = ms / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years);
});

EmployeSchema.index({ departement: 1 });
EmployeSchema.index({ statut: 1 });
EmployeSchema.index({ nom: 'text', prenom: 'text' });

module.exports = mongoose.model('Employe', EmployeSchema);
