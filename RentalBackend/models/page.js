const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, // Page Title (e.g., "Privacy Policy")
  slug: { type: String, required: true, unique: true }, // URL-friendly identifier (e.g., "privacy-policy")
  content: { type: String, required: true }, // HTML/Text content of the page
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // Tracks who updated the page
  updatedAt: { type: Date, default: Date.now } // Timestamp of last update
});

module.exports = mongoose.model('Page', PageSchema);
