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

exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Fetch booking details and populate vehicle and owner details
    const booking = await Booking.findById(bookingId)
      .populate('vehicleId')
      .populate({
        path: 'ownerId',
        populate: { path: 'kycId' } // Get owner details along with KYC
      })
      .populate('renterId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.ownerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this booking' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const { bookingId, approvedAddOns } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(bookingId).populate('vehicleId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this booking' });
    }

    // Check for overlapping confirmed bookings for the same vehicle
    const overlappingBookings = await Booking.find({
      vehicleId: booking.vehicleId,
      bookingStatus: 'Confirmed',
      _id: { $ne: bookingId }, // Exclude the current booking
      $or: [
        { startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } },
        { startDate: { $gte: booking.startDate }, startDate: { $lte: booking.endDate } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ message: 'There is another confirmed booking with overlapping dates.' });
    }

    let totalApprovedPrice = 0;
    let allAddOnsApproved = true;
    
    // Process approved add-ons
    const updatedApprovedAddOns = booking.addOns.map(addOn => {
      const approved = approvedAddOns.find(a => a.name === addOn.name);
      if (approved) {
        totalApprovedPrice += approved.totalPrice;
        return approved;
      } else {
        allAddOnsApproved = false;
        return null;
      }
    }).filter(Boolean);

    // Update booking amountDue based on approved add-ons
    const newTotalPrice = (booking.vehicleId.dailyPrice * booking.totalDays) + totalApprovedPrice;
    
    // Update booking status based on add-on approvals
    booking.bookingStatus = allAddOnsApproved ? 'Accepted' : 'RevisionRequired';
    booking.approvedAddOns = updatedApprovedAddOns;
    booking.amountDue = newTotalPrice;
    booking.ownerApproval = true;
    booking.updatedAt = Date.now();

    // Save updated booking
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};