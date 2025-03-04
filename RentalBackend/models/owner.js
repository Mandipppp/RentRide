const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'owner' },
  contactNumber: { type: String },
  kycId: { type: mongoose.Schema.Types.ObjectId, ref: 'KYC' },
  walletId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },

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

module.exports = mongoose.model('Owner', OwnerSchema);
