const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Renter who books the vehicle
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true }, // Owner of the vehicle
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true }, // The booked vehicle

  startDate: { type: Date, required: true }, // Rental start date
  endDate: { type: Date, required: true }, // Rental end date
  totalDays: { type: Number, required: true }, // Duration in days
  pickAndDropLocation: {type: String, required: false},
  pickupTime: { type: String, default: null }, // Optional pickup time
  dropTime: { type: String, default: null }, // Optional drop-off time

  bookingStatus: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'RevisionRequired', 'Confirmed', 'Active', 'Cancelled', 'Completed'], 
    default: 'Pending' 
  }, // Status of booking

  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Full', 'Refunded'], 
    default: 'Pending' 
  }, // Payment completion status

  addOns: [
    {
      name: { type: String, required: true }, // Name of the add-on
      pricePerDay: { type: Number, required: true }, // Price of the add-on per day
      totalPrice: { type: Number, required: true } // Total price of the add-on for the entire booking
    }
  ], // Add-ons selected for this booking

  approvedAddOns: [ // Store what the owner actually approved
    {
      name: { type: String, required: true },
      pricePerDay: { type: Number, required: true },
      totalPrice: { type: Number, required: true }
    }
  ],
  
  amountDue: { type: Number, required: true }, // Total rental cost
  amountPaid: { type: Number, default: 0 }, // Amount already paid

  paymentMethod: { type: String, enum: ['Cash', 'Online', 'Bank Transfer'], default: 'Online' }, // Payment option
  cancellationFee: { type: Number, default: 0 }, // Cancellation charge (10% if applicable)
  
  renterMessage: { type: String }, 
  ownerApproval: { type: Boolean, default: false }, // Whether owner has approved the booking
  ownerReviewed: { type: Boolean, default: false },

  refundRequest: {
    requested: { type: Boolean, default: false }, // Whether a refund has been requested
    walletName: { type: String, default: null }, // walletId name
    walletId: { type: String, default: null }, // Wallet ID for refund transfer
  },

  /** Rental Tracking Fields **/
  rentalStartConfirmed: { type: Boolean, default: false }, // When owner clicks "Start Rental"
  rentalStartTime: { type: Date, default: null }, // Actual rental start time
  
  rentalEndConfirmed: { type: Boolean, default: false }, // When owner clicks "Vehicle Returned"
  rentalEndTime: { type: Date, default: null }, // Actual rental return time

  emailSentForStart: { type: Boolean, default: false }, //check if user has been notified for this booking or not
  emailSentForEnd: { type: Boolean, default: false }, 

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

////////////////
BookingSchema.post("save", async function (doc) {
  const io = require("../socket").getIo();
  const users = require("../app").users;
  const Booking = require("../models/Booking");

  try {
    // Populate vehicle and owner details
    const updatedBooking = await Booking.findById(doc._id)
      .populate("renterId", "name email") // Include renter details
      .populate("vehicleId", "name type builtYear dailyPrice imageUrls") // Include vehicle details
      .lean(); // Convert Mongoose document to plain JSON object

    if (!updatedBooking) return;

    const ownerSocketId = users.get(updatedBooking.ownerId.toString());
    const renterSocketId = users.get(updatedBooking.renterId.toString());

    if (ownerSocketId) io.to(ownerSocketId).emit("bookingUpdated", updatedBooking);
    if (renterSocketId) io.to(renterSocketId).emit("bookingUpdated", updatedBooking);
    // console.log(`Booking ${doc._id} status changed to ${doc.bookingStatus}`);
  } catch (error) {
    console.error("Error populating booking before WebSocket emit:", error);
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
