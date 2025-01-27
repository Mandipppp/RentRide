const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientModel: { type: String, enum: ['User', 'Owner'], required: true }, // Specifies whether the recipient is a User or Owner
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'kyc', 'payment', 'system', 'vehicle'], required: true },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

// Dynamically populate based on recipientModel
NotificationSchema.virtual('recipient', {
  refPath: 'recipientModel',
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true,
});

module.exports = mongoose.model('Notification', NotificationSchema);