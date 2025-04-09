const Booking = require("../models/Booking");
const Owner = require('../models/owner');
const User = require('../models/user');
const Vehicle = require('../models/vehicle');

exports.getAllBookings = async (req, res) => {
    try {
      // Extract query parameters
      const { renterName, ownerName, vehicleName, bookingStatus, paymentStatus, startDate, endDate } = req.query;
  
      const filter = {};
  
     // Filter by renterName if provided
     if (renterName) {
        const renters = await User.find({ name: { $regex: renterName, $options: 'i' } }).select('_id');
        if (renters.length > 0) {
            filter.renterId = { $in: renters.map(renter => renter._id) };
        }
    }

    // Filter by ownerName if provided
    if (ownerName) {
        const owners = await Owner.find({ name: { $regex: ownerName, $options: 'i' } }).select('_id');
        if (owners.length > 0) {
            filter.ownerId = { $in: owners.map(owner => owner._id) };
        }
    }

    // Filter by vehicleName if provided
    if (vehicleName) {
        const vehicles = await Vehicle.find({ name: { $regex: vehicleName, $options: 'i' } }).select('_id');
        if (vehicles.length > 0) {
            filter.vehicleId = { $in: vehicles.map(vehicle => vehicle._id) };
        }
    }
  
      // Filter by booking status if provided
      if (bookingStatus) {
        filter.bookingStatus = bookingStatus;
      }
  
      // Filter by payment status if provided
      if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
      }
  
      // Filter by date range if provided
      if (startDate && endDate) {
        filter.startDate = { $gte: new Date(startDate) };
        filter.endDate = { $lte: new Date(endDate) };
      } else if (startDate) {
        filter.startDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        filter.endDate = { $lte: new Date(endDate) };
      }
  
      // Fetch bookings from the database based on the filter
      const bookings = await Booking.find(filter)
        .populate({
          path: 'renterId',
          select: 'name email contactNumber', // Include these fields
        })
        .populate({
          path: 'ownerId',
          select: 'name email contactNumber', // Include these fields
        })
        .populate({
          path: 'vehicleId',
          select: 'name registrationNumber type category', // Include these
        });
  
      // Check if bookings exist
      if (!bookings || bookings.length === 0) {
        return res.status(200).json({
            success: true,
            data: [],
            message: 'No bookings found.',
        });
      }
  
      // Respond with the bookings data
      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      // Handle any errors
      console.error('Error fetching bookings:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
        error: error.message,
      });
    }
  };
  

exports.getBooking = async (req, res) => {
  try {
      const { bookingId } = req.params;

      // Check if bookingId is there
      if (!bookingId) {
          return res.status(400).json({
              success: false,
              message: 'Booking ID is required'
          });
      }

      // Fetch the booking with populated fields
      const booking = await Booking.findById(bookingId)
          .populate({
              path: 'renterId',
              select: 'name email contactNumber'
          })
          .populate({
              path: 'ownerId',
              select: 'name email contactNumber'
          })
          .populate({
              path: 'vehicleId',
              select: 'name registrationNumber type category price images'
          });

      // Check if booking exists
      if (!booking) {
          return res.status(404).json({
              success: false,
              message: 'Booking not found'
          });
      }

      // Return the booking details
      return res.status(200).json({
          success: true,
          data: booking
      });

  } catch (error) {
      console.error('Error fetching booking details:', error.message);
      return res.status(500).json({
          success: false,
          message: 'Server error. Please try again later.',
          error: error.message
      });
  }
};