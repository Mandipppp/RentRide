const mongoose = require('mongoose');

const KYCSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  documents: {
    citizenshipFront: {
      file: { type: String, required: true },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      comments: { type: String },
    },
    citizenshipBack: {
      file: { type: String, required: true },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      comments: { type: String },
    },
    profilePicture: {
      file: { type: String, required: true },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      comments: { type: String },
    },
  },
  overallStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('KYC', KYCSchema);
