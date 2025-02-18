const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
});

module.exports = mongoose.model('Review', ReviewSchema);
