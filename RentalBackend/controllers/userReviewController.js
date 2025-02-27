const Review = require('../models/review');
const Booking = require('../models/Booking'); // Import the Booking model

// POST method to allow users to post a review
exports.postReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user.id;

    // Step 1: Validate bookingId, check if the booking exists and is completed
    const booking = await Booking.findById(bookingId).populate('vehicleId');

    if (!booking) {
      return res.status(400).json({ message: 'Booking not found.' });
    }

    // Ensure the booking belongs to the logged-in user
    if (booking.renterId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only review your own bookings.' });
    }

    // Ensure the booking status is "Completed"
    if (booking.bookingStatus !== 'Completed') {
      return res.status(400).json({ message: 'You can only review completed bookings.' });
    }

    // Step 2: Check if the booking was completed within the last 24 hours
    const currentTime = new Date();
    const bookingEndTime = new Date(booking.endDate);

    const timeDifference = currentTime - bookingEndTime; // In milliseconds
    const hoursDifference = timeDifference / (1000 * 60 * 60); // Convert to hours

    if (hoursDifference > 24) {
      return res.status(400).json({ message: 'You can only post a review within 24 hours of completing the booking.' });
    }

    // Step 3: Check if a review has already been posted for this booking by the user
    const existingReview = await Review.findOne({ bookingId, userId });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already posted a review for this booking.' });
    }

    // Step 4: Create the review and include the bookingId
    const review = new Review({
      vehicleId: booking.vehicleId._id,
      userId: userId,
      bookingId: bookingId,
      rating,
      comment,
    });

    // Save the review to the database
    await review.save();

    // Return success response
    return res.status(201).json({ message: 'Review posted successfully!', review });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


exports.getReviews = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const reviews = await Review.find({ 
      vehicleId, 
      status: 'Approved' // Filter reviews with "Approved" status
    })
      .populate('userId', 'name')
      .populate('bookingId', 'startDate endDate')
      .sort({ createdAt: -1 });

    // Fetch all reviews to get all booking IDs
    const allReviews = await Review.find({ vehicleId }).select('bookingId');
    // Extract booking IDs
    const bookingIds = allReviews.map(review => review.bookingId);

    // Calculate the average rating
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRatings / reviews.length).toFixed(1) : null; // 1 decimal place
    res.json({ reviews, averageRating, bookingIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
}