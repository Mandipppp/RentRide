const Review = require('../models/review');
const User = require('../models/user');
const Vehicle = require('../models/vehicle');

exports.getAllReviews = async (req, res) => {
  try {
    const { status, userName, vehicleName } = req.query;
    const filter = {};

    // Filter by renterName
    if (userName) {
        const renters = await User.find({ name: { $regex: userName, $options: 'i' } }).select('_id');
        if (renters.length > 0) {
            filter.userId = { $in: renters.map(renter => renter._id) };
        }
    }
    
    if (vehicleName) {
        const renters = await Vehicle.find({ name: { $regex: vehicleName, $options: 'i' } }).select('_id');
        if (renters.length > 0) {
            filter.vehicleId = { $in: renters.map(renter => renter._id) };
        }
    }
    // Filter by booking status
    if (status) {
    filter.status = status;
    }

    // Fetch all reviews from the database
    const reviews = await Review.find(filter)
      .populate('vehicleId', 'name')
      .populate('userId', 'name')
      .populate('bookingId', '_id');

    if (!reviews || reviews.length === 0) {
        return res.status(200).json({
            success: true,
            data: [],
            message: 'No reviews found.',
        });
      }
  
      return res.status(200).json({
        success: true,
        data: reviews,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateReviewStatus = async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { status } = req.body;
  
      // Validate status
      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Allowed values are "approved" or "rejected".',
        });
      }
  
      // Find the review by ID
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found.',
        });
      }
  
      // Update the review status
      review.status = status;
      await review.save();
  
      return res.status(200).json({
        success: true,
        message: `Review has been ${status}.`,
        data: review,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };