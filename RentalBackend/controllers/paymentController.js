const axios = require("axios");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
require('dotenv').config();


const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL;
const headers = {
  Authorization: `Key ${KHALTI_SECRET_KEY}`,
  "Content-Type": "application/json",
};

// Initiate Payment
const initiatePayment = async (req, res) => {
  try {
    const { amount, purchase_order_id, purchase_order_name, return_url, website_url, totalAmount, ownerId } = req.body;
    const roundedAmount = amount;
    // Check if the amountPaid is at least 10% of totalAmount
    // console.log(userid=req.user.id);
    if (amount < totalAmount * 0.1) {
      return res.status(400).json({ success: false, message: "At least 10% of the total amount is required to lock the booking." });
    }

    // Find booking to ensure it exists
    const booking = await Booking.findById(purchase_order_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const payload = {
      return_url,
      website_url,
      amount: roundedAmount,
      purchase_order_id,
      purchase_order_name,
    };

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/initiate/`,
      payload,
      { headers }
    );
    // Save payment record
    const newPayment = new Payment({
      senderType: "User",
      senderId: booking.renterId,
      receiverType: "Owner",
      receiverId: ownerId,
      bookingId: booking._id,
      amountPaid: amount/100,
      totalAmount,
      paymentMethod: "Khalti",
      paymentType: "Payment",
      paymentStatus: "Pending",
      transactionId: response.data.pidx, // Store Khalti transaction ID
      isFullPayment: amount/100 >= totalAmount, // Check if full payment
    });

    await newPayment.save();

    res.json(response.data);
  } catch (error) {
    console.error("Khalti Payment Error:", error);

    if (error.response) {
      res.status(error.response.status || 400).json(error.response.data);
    } else if (error.request) {
      res.status(500).json({ message: "No response from Khalti. Check your internet or API URL." });
    } else {
      res.status(500).json({ message: "Request failed before reaching Khalti.", error: error.message });
    }
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/lookup/`,
      { pidx },
      { headers }
    );

    if (response.data.status !== "Completed") {
      return res.status(400).json({ success: false, message: "Payment not completed yet." });
    }

    // Find the payment entry
    const payment = await Payment.findOne({ transactionId: pidx });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    // Update payment status
    payment.paymentStatus = "Completed";
    await payment.save();

    // Update booking details
    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    booking.amountPaid += payment.amountPaid;

    // Update payment status in booking
    if (booking.amountPaid >= booking.amountDue) {
      booking.paymentStatus = "Full";
    } else {
      booking.paymentStatus = "Partial";
    }
    
    booking.amountDue -= payment.amountPaid;

    // Change the bookingStatus to "Confirmed" if payment is successful
    booking.bookingStatus = "Confirmed";
    await booking.save();

    res.json(response.data);
  } catch (error) {
    res.status(400).json(error.response.data);
  }
};

module.exports = { initiatePayment, verifyPayment };
