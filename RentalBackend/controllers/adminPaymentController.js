const Payment = require('../models/Payment');
const User = require('../models/user');
const Owner = require('../models/owner');
const { default: mongoose } = require('mongoose');


// Get all payments with filters (transactionId, paymentStatus, etc.)
const getAllPayments = async (req, res) => {
  try {
    // Extract query parameters
    const { transactionId, paymentStatus, paymentType, senderName, receiverName } = req.query;
    
    const filter = {};

    // Filter by transactionId (if provided)
    if (transactionId) {
      filter.transactionId = { $regex: transactionId, $options: 'i' }; // Case-insensitive match
    }

    // Filter by paymentStatus (if provided)
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Filter by paymentStatus (if provided)
    if (paymentType) {
      filter.paymentType = paymentType;
    }

    // // Filter by sender name (if provided)
    // if (senderName) {
    //   const senderFilter = { $regex: senderName, $options: 'i' }; // Case-insensitive match
    //   const senderUsers = await User.find({ name: senderFilter }).select('_id');
    //   const senderOwners = await Owner.find({ name: senderFilter }).select('_id');
      

    //   // Only set senderId filter if matches are found
    //   if (senderUsers.length > 0 || senderOwners.length > 0) {
    //     filter.senderId = { $in: [...senderUsers.map(user => user._id), ...senderOwners.map(owner => owner._id)] };
    //   }
    // }

    // // Filter by receiver name (if providedm
    // if (receiverName) {
    //   const receiverFilter = { $regex: receiverName, $options: 'i' }; // Case-insensitive match
    //   const receiverUsers = await User.find({ name: receiverFilter }).select('_id');
    //   const receiverOwners = await Owner.find({ name: receiverFilter }).select('_id');

    //   // Only set receiverId filter if matches are found
    //   if (receiverUsers.length > 0 || receiverOwners.length > 0) {
    //     filter.receiverId = { $in: [...receiverUsers.map(user => user._id), ...receiverOwners.map(owner => owner._id)] };
    //   }
    // }

    // Fetch payments from the database based on the filter
    const payments = await Payment.find(filter)
      .populate({
        path: 'senderId receiverId',
        select: 'name email', // Only include specific fields from the sender and receiver
      })
      .sort({ createdAt: -1 }); // Optional: Sort payments by most recent

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
    // Handle any errors
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
