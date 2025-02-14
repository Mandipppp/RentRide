const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    senderType: { type: String, enum: ["User", "Owner"], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "senderType" },

    receiverType: { type: String, enum: ["User", "Owner"], required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "receiverType" },

    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    amountPaid: { type: Number, required: true }, // Amount paid in this transaction
    totalAmount: { type: Number, required: true }, // Total amount for the booking
    paymentMethod: { type: String, enum: ["Khalti", "Esewa", "IME Pay", "Other"], required: true },

    paymentType: { type: String, enum: ["Payment", "Refund"], required: true },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Completed", "Failed", "Refunded"], 
      default: "Pending" 
    },

    transactionId: { type: String, unique: true },
    isFullPayment: { type: Boolean, default: false }, // True if it's a full payment
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
