const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    expediteur: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destinataire: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sujet: {
      type: String,
      required: [true, 'Le sujet est obligatoire'],
      trim: true,
      maxlength: [150, 'Le sujet ne peut depasser 150 caracteres'],
    },
    contenu: {
      type: String,
      required: [true, 'Le contenu est obligatoire'],
      trim: true,
      maxlength: [5000, 'Le contenu ne peut depasser 5000 caracteres'],
    },
    lu: {
      type: Boolean,
      default: false,
      index: true,
    },
    dateLecture: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ destinataire: 1, lu: 1, createdAt: -1 });
MessageSchema.index({ expediteur: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
