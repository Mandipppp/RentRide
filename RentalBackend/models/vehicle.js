const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Car', 'Bike', 'SUV', 'Truck', 'Van'], required: true },
  category: { type: String, enum: ['Two-Wheeler', 'Four-Wheeler'], required: true },
  fuel: { type: String, enum: ['Petrol', 'Diesel', 'Electric'], required: true },
  transmission: { type: String, enum: ['Manual', 'Automatic']},
  brand: { type: String },
  builtYear: {type: String},
  mileage: {type: Number},
  seats: {type: Number},
  registrationNumber: { type: String, unique: true, required: true },
  description: { type: String },
  dailyPrice: { type: Number, required: true },
  minRentalPeriod: { type: Number, default: 1 },
  maxRentalPeriod: { type: Number },
  features: { type: [String] },
  addOns: [
    {
      name: { type: String, required: true }, // Name of the add-on
      pricePerDay: { type: Number, required: true }, // Price of the add-on per day
    },
  ],
  condition: { type: String, enum: ['Excellent', 'Good', 'Fair'], default: 'Good' },
  status: { type: String, enum: ['Available', 'Booked', 'Under Maintenance','Deleted'], default: 'Available' },
  imageUrls: {
    type: [String],
    validate: {
      validator: function (v) {
        return v.length >= 3 && v.length <= 5; // At least 3, at most 5
      },
      message: 'A minimum of 3 and a maximum of 5 images are required.',
    },
    required: true,
  },
  pickupLocation: { type: String },
  latitude: { type: Number, required: false, default: null },
  longitude: { type: Number, required: false, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Verification Fields
  registrationCertificate: {
    file: { type: String, required: true }, // Path to registration document
    status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    comments: { type: String }, // Admin comments on rejection
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
  },
  insuranceCertificate: {
    file: { type: String, required: true }, // Path to insurance document
    status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    comments: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
  },
  isVerified: { type: Boolean, default: false }, 
  isInsured: { type: Boolean, default: false },
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
