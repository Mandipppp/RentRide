const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true }, // Links chat to a specific booking
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true }, // Owner in the chat
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Renter in the chat
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }], // List of messages
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', ChatSchema);
