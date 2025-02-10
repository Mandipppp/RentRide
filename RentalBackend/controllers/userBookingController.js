const Booking = require('../models/Booking');
const Notification = require('../models/notification');
const Vehicle = require('../models/vehicle');
// const User = require('../models/user'); 
// const Owner = require('../models/Owner');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      vehicleId,
      startDate,
      endDate,
      pickAndDropLocation,
      pickupTime,
      dropTime,
      addOns
    } = req.body;

    const renterId = req.user.id;
    // Fetch vehicle details
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Check if the user already has a booking for the same vehicle
    const existingBooking = await Booking.findOne({
      renterId,
      vehicleId, 
      bookingStatus: { $in: ['Pending', 'Confirmed', 'Accepted']}
    });

    //in case for bookings on different days
    // $or: [
    //   { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
    // ]

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have an active booking for this vehicle.' });
    }

    // Get owner ID from vehicle
    const ownerId = vehicle.ownerId;

    // Calculate total days
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) return res.status(400).json({ message: 'Invalid booking duration' });

     // Validate optional pickup and drop times (if provided)
     const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Matches HH:mm (24-hour format)
     if (pickupTime && !timeRegex.test(pickupTime)) {
       return res.status(400).json({ message: 'Invalid pickup time format. Use HH:mm (24-hour format).' });
     }
     if (dropTime && !timeRegex.test(dropTime)) {
       return res.status(400).json({ message: 'Invalid drop time format. Use HH:mm (24-hour format).' });
     }

    // Calculate add-ons total price and include totalPrice in each addOn
    const updatedAddOns = addOns.map((addOn) => {
      const totalPrice = (addOn.pricePerDay || 0) * totalDays;
      return { ...addOn, totalPrice };
    });

    // Calculate add-ons total price
    const addOnsTotal = updatedAddOns.reduce((sum, addOn) => sum + addOn.totalPrice, 0);

    // Calculate total amount due
    const amountDue = (vehicle.dailyPrice * totalDays) + addOnsTotal;

    // Create new booking
    const newBooking = new Booking({
      renterId,
      ownerId,
      vehicleId,
      startDate,
      endDate,
      totalDays,
      pickAndDropLocation,
      pickupTime,
      dropTime, 
      bookingStatus: 'Pending',
      paymentStatus: 'Pending',
      addOns: updatedAddOns,
      amountDue
    });

    await newBooking.save();

    // Send notification to the owner
    const notification = new Notification({
      recipientId: ownerId,
      recipientModel: 'Owner',
      message: `New booking request from a renter for vehicle ${vehicle.name}.`,
      type: 'booking',
      priority: 'high'
    });

    await notification.save();

    res.status(201).json({ message: 'Booking request sent', booking: newBooking });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Owner approves/rejects the booking
exports.updateBookingStatus = async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body; // 'Accepted' or 'Cancelled'
  
      if (!['Accepted', 'Cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status update' });
      }
  
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
      if (req.user._id.toString() !== booking.ownerId.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      booking.bookingStatus = status;
      await booking.save();
  
      const message = status === 'Accepted' ? 
        'Your booking has been accepted. Please proceed with payment.' : 
        'Your booking request has been declined.';
  
      // Notify renter
      await new Notification({
        recipientId: booking.renterId,
        recipientModel: 'User',
        message,
        type: 'booking',
        priority: 'high'
      }).save();
  
      res.status(200).json({ message: `Booking ${status.toLowerCase()} successfully.`, booking });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
