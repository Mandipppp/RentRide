const Payment = require('../models/Payment');
const User = require('../models/user');
const Owner = require('../models/owner');
const { default: mongoose } = require('mongoose');


const getAllPayments = async (req, res) => {
  try {
    const { transactionId, paymentStatus, paymentType, senderName, receiverName } = req.query;
    
    const filter = {};

    // Filter by transactionId if provided
    if (transactionId) {
      filter.transactionId = { $regex: transactionId, $options: 'i' }; // Case-insensitive match
    }

    // Filter by paymentStatus if provided
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Filter by paymentStatus if provided
    if (paymentType) {
      filter.paymentType = paymentType;
    }

    // Fetch payments from the database based on the filter
    const payments = await Payment.find(filter)
      .populate({
        path: 'senderId receiverId',
        select: 'name email', // Only include specific fields from the sender and receiver
      })
      .sort({ createdAt: -1 });

    // Check if payments exist
    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: false,
        data: [],
        message: 'No payments found.',
      });
    }

    // Respond with the payments data
    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllPayments,
};
