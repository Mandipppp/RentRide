const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Renter who books the vehicle
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true }, // Owner of the vehicle
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true }, // The booked vehicle

  startDate: { type: Date, required: true }, // Rental start date
  endDate: { type: Date, required: true }, // Rental end date
  totalDays: { type: Number, required: true }, // Duration in days
  pickAndDropLocation: {type: String, required: true},

  bookingStatus: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], 
    default: 'Pending' 
  }, // Status of booking

  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Full', 'Refunded'], 
    default: 'Pending' 
  }, // Payment completion status

  amountDue: { type: Number, required: true }, // Total rental cost
  amountPaid: { type: Number, default: 0 }, // Amount already paid

  paymentMethod: { type: String, enum: ['Cash', 'Online', 'Bank Transfer'], default: 'Online' }, // Payment option
  cancellationFee: { type: Number, default: 0 }, // Cancellation charge (10% if applicable)
  
  renterMessage: { type: String }, // Message from renter to owner (optional)
  ownerApproval: { type: Boolean, default: false }, // Whether owner has approved the booking

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
