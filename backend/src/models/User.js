// =============================================================
// backend/src/models/User.js
// Mongoose Schema — Utilisateurs de l'ERP
// =============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const { Schema } = mongoose;

const ROLES = ['ADMIN', 'COMPTABLE', 'RH', 'MAGASINIER'];

const UserSchema = new Schema(
  {
    nom: {
      type     : String,
      required : [true, 'Le nom est obligatoire'],
      trim     : true,
      maxlength: [50, 'Le nom ne peut dépasser 50 caractères'],
    },

    prenom: {
      type     : String,
      required : [true, 'Le prénom est obligatoire'],
      trim     : true,
      maxlength: [50, 'Le prénom ne peut dépasser 50 caractères'],
    },

    email: {
      type     : String,
      required : [true, "L'email est obligatoire"],
      unique   : true,
      lowercase: true,
      trim     : true,
      match    : [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Format d'email invalide",
      ],
    },

    password: {
      type     : String,
      required : [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Minimum 8 caractères'],
      select   : false, // Jamais retourné par défaut dans les requêtes
    },

    role: {
      type   : String,
      enum   : { values: ROLES, message: `Rôle invalide. Valeurs : ${ROLES.join(', ')}` },
      default: 'MAGASINIER',
    },

    actif: {
      type   : Boolean,
      default: true,
    },

    dernierLogin: { type: Date },

    resetPasswordToken : { type: String, select: false },
    resetPasswordExpire: { type: Date,   select: false },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// --- Indexes ---
UserSchema.index({ role: 1 });

// --- Virtuel : nom complet ---
UserSchema.virtual('nomComplet').get(function () {
  return `${this.prenom} ${this.nom}`;
});

// --- Hook pre-save : hashage automatique du mot de passe ---
// Ne re-hashe que si le champ password a été modifié
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Méthode d'instance : vérification du mot de passe ---
// Utilisée dans authController : await user.verifierPassword(mdpSaisi)
UserSchema.methods.verifierPassword = async function (passwordSaisi) {
  return bcrypt.compare(passwordSaisi, this.password);
};

module.exports = mongoose.model('User', UserSchema);
