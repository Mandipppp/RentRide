const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }, // Links message to a chat
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Sender (owner or renter)
    message: { type: String, required: true }, // Chat message content
    seen: { type: Boolean, default: false }, // Tracks if message is read
    createdAt: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('Message', MessageSchema);
  