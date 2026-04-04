const mongoose = require('mongoose');

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
      default: 'INFO',
    },
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
      maxlength: [140, 'Le titre ne peut depasser 140 caracteres'],
    },
    message: {
      type: String,
      required: [true, 'Le message est obligatoire'],
      trim: true,
      maxlength: [2000, 'Le message ne peut depasser 2000 caracteres'],
    },
    module: {
      type: String,
      trim: true,
      default: 'GENERAL',
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    data: {
      type: Schema.Types.Mixed,
      default: null,
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
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, lu: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
