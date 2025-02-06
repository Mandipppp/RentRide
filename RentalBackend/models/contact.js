const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's name
  email: { type: String, required: true }, // User's email for reply
  phone: { type: String, required: false }, // User's phone number (optional)
  subject: { type: String, required: true }, // Subject of the inquiry
  message: { type: String, required: true }, // User's message
  status: { 
    type: String, 
    enum: ['Pending', 'Resolved', 'Closed'], 
    default: 'Pending' 
  }, // Status of the inquiry
  response: { type: String }, // Admin response message (if any)
}, { timestamps: true }); // Automatically handles createdAt and updatedAt

module.exports = mongoose.model('Contact', ContactSchema);
