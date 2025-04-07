const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['renter', 'admin', 'superadmin'], default: 'renter' },
  contactNumber: { type: String },
  createdAt: { type: Date, default: Date.now },

  // Fields for password reset
  resetPasswordToken: { type: String }, // Token for password reset
  resetPasswordExpiry: { type: Date },  // Expiry date for the token

  // Blocking Feature
  blockStatus: { 
    type: String, 
    enum: ['active', 'pending_block', 'blocked'], 
    default: 'active' 
  }, 
  blockReason: { type: String, default: null }, // Reason for blocking
  blockInitiatedAt: { type: Date, default: null }, // When block was requested
  blockedAt: { type: Date, default: null } // When block was applied
  
});

module.exports = mongoose.model('User', UserSchema);
