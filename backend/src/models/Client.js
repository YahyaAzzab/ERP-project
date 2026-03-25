const mongoose = require('mongoose');

const { Schema } = mongoose;

const ClientSchema = new Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du client est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    telephone: { type: String, trim: true },
    adresse: { type: String, trim: true },
    ville: { type: String, trim: true },
    pays: { type: String, default: 'Maroc', trim: true },
    secteurActivite: { type: String, trim: true },
    chiffreAffaires: { type: Number, default: 0 },
    nombreFactures: { type: Number, default: 0 },
    statut: {
      type: String,
      enum: ['ACTIF', 'INACTIF'],
      default: 'ACTIF',
    },
    notes: { type: String, trim: true },
    creePar: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

ClientSchema.index({ nom: 'text', email: 'text', ville: 'text' });
ClientSchema.index({ statut: 1 });
ClientSchema.index({ secteurActivite: 1 });

module.exports = mongoose.model('Client', ClientSchema);
