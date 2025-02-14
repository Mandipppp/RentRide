const Booking = require('../models/Booking');
const Notification = require('../models/notification');
const Vehicle = require('../models/vehicle');
const User = require('../models/user'); 
const Owner = require('../models/owner');
const nodemailer = require("nodemailer");

exports.getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.id; // Extract renter ID from authenticated user

    const bookings = await Booking.find({ ownerId })
      .populate('renterId', 'name email') // Populate owner details
      .populate('vehicleId', 'name type builtYear dailyPrice imageUrls') // Populate vehicle details
      .sort({ createdAt: 1 }); // FIFO

      // Categorize bookings
    const categorizedBookings = {
      upcoming: bookings.filter(b => ["Pending", "Accepted"].includes(b.bookingStatus)),
      active: bookings.filter(b => b.bookingStatus === "Confirmed"),
      completed: bookings.filter(b => b.bookingStatus === "Completed"),
      cancelled: bookings.filter(b => b.bookingStatus === "Cancelled"),
    };

    if (!bookings.length) {
      return res.status(404).json({ message: 'No bookings found for this owner.' });
    }

    res.status(200).json({ success: true, bookings:categorizedBookings });
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};