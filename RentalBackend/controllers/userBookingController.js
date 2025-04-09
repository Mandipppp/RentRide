const Booking = require('../models/Booking');
const Notification = require('../models/notification');
const Vehicle = require('../models/vehicle');
const User = require('../models/user'); 
const Chat = require('../models/Chat'); 
const Owner = require('../models/owner');
const nodemailer = require("nodemailer");

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
    const renter = await User.findById(renterId);
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

    if (renter.blockStatus == "blocked") {
      return res.status(400).json({ message: 'You are blocked by the admin to perform any activities.' });
    }

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have an active booking for this vehicle.' });
    }

    // Get owner ID from vehicle
    const ownerId = vehicle.ownerId;
    const owner = await Owner.findById(ownerId);

    // Calculate total days
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) return res.status(400).json({ message: 'Invalid booking duration' });

     // Validate optional pickup and drop times
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

    // Send Email Notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: owner.email,
      subject: `New Booking Request for Your Vehicle: ${vehicle.name}`,
      html: `
        <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f4f4f4;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #4CAF50;
          }
          .content {
            font-size: 16px;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          .button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-align: center;
            display: inline-block;
            font-size: 16px;
            border-radius: 5px;
            text-decoration: none;
          }
          .button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Request</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${owner.name}</strong>,</p>
            
            <p>We’re excited to inform you that your vehicle, <strong>${vehicle.name}</strong>, has received a new booking request from <strong>${renter.name}</strong>.</p>

            <p><strong>Booking Details:</strong></p>
            <ul>
              <li><strong>Pickup Date:</strong> ${startDate}</li>
              <li><strong>Drop-off Date:</strong> ${endDate}</li>
              <li><strong>Pickup Location:</strong> ${pickAndDropLocation}</li>
              <li><strong>Pickup Time:</strong> ${pickupTime || "Not specified"}</li>
              <li><strong>Drop-off Time:</strong> ${dropTime || "Not specified"}</li>
              <li><strong>Total Days:</strong> ${totalDays}</li>
              <li><strong>Amount Due:</strong> $${amountDue}</li>
            </ul>

            <p>Please review and respond to this request at your earliest convenience.</p>

            <p><a href="${process.env.BASE_URL}/ownerbookings" class="button">View Booking</a></p>

            <p>Thank you for choosing RentRide!</p>

            <p>Best regards,<br/>The RentRide Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 RentRide. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
      `,
    };
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Booking request sent', booking: newBooking });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.editPendingBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      startDate,
      endDate,
      pickAndDropLocation,
      pickupTime,
      dropTime,
      addOns
    } = req.body;

    const renterId = req.user.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.renterId.toString() !== renterId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.bookingStatus !== 'Pending') {
      return res.status(400).json({ message: 'Only pending bookings can be edited' });
    }

    // Fetch vehicle details
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Calculate total days
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) return res.status(400).json({ message: 'Invalid booking duration' });

    // Check against vehicle's min and max rental period
    if (vehicle.minRentalPeriod && totalDays < vehicle.minRentalPeriod) {
      return res.status(400).json({ message: `Minimum rental period is ${vehicle.minRentalPeriod} days` });
    }
    if (vehicle.maxRentalPeriod && totalDays > vehicle.maxRentalPeriod) {
      return res.status(400).json({ message: `Maximum rental period is ${vehicle.maxRentalPeriod} days` });
    }

    // Validate optional pickup and drop times (if provided)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (pickupTime && !timeRegex.test(pickupTime)) {
      return res.status(400).json({ message: 'Invalid pickup time format. Use HH:mm (24-hour format).' });
    }
    if (dropTime && !timeRegex.test(dropTime)) {
      return res.status(400).json({ message: 'Invalid drop time format. Use HH:mm (24-hour format).' });
    }

    // Calculate add-ons total price and update addOns
    const updatedAddOns = addOns.map((addOn) => {
      const totalPrice = (addOn.pricePerDay || 0) * totalDays;
      return { ...addOn, totalPrice };
    });
    const addOnsTotal = updatedAddOns.reduce((sum, addOn) => sum + addOn.totalPrice, 0);

    // Calculate total amount due
    const amountDue = (vehicle.dailyPrice * totalDays) + addOnsTotal;

    // Update booking details
    booking.startDate = startDate;
    booking.endDate = endDate;
    booking.totalDays = totalDays;
    booking.pickAndDropLocation = pickAndDropLocation;
    booking.pickupTime = pickupTime;
    booking.dropTime = dropTime;
    booking.addOns = updatedAddOns;
    booking.amountDue = amountDue;
    booking.updatedAt = Date.now();

    await booking.save();

    res.status(200).json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllBookings = async (req, res) => {
  try {
    const renterId = req.user.id;
    const bookings = await Booking.find({ renterId, bookingStatus: "Pending" }).select("vehicleId");

    // Extract only vehicle IDs
    const vehicleIds = bookings.map((booking) => booking.vehicleId);

    res.json(vehicleIds);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking requests" });
  }
}

exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Fetch booking details and populate vehicle and owner details
    const booking = await Booking.findById(bookingId)
      .populate('vehicleId')
      .populate({
        path: 'ownerId',
        populate: { path: 'kycId' } // Get owner details along with KYC
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllVehicleBookings = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const bookings = await Booking.find({
      vehicleId,
      bookingStatus: { $in: ["Accepted", "Confirmed"] }, // Filter by status
    });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getRenterBookings = async (req, res) => {
  try {
    const renterId = req.user.id;

    const bookings = await Booking.find({ renterId })
      .populate('ownerId', 'name email') // Populate owner details
      .populate('vehicleId', 'name type builtYear dailyPrice imageUrls') // Populate vehicle details
      .sort({ createdAt: -1 }); // Sort by latest bookings

      // Categorize bookings
    const categorizedBookings = {
      upcoming: bookings.filter(b => ["Pending", "Accepted", 'RevisionRequired', "Confirmed"].includes(b.bookingStatus)),
      active: bookings.filter(b => b.bookingStatus === "Active"),
      completed: bookings.filter(b => b.bookingStatus === "Completed"),
      cancelled: bookings.filter(b => (b.bookingStatus === "Cancelled" && (b.paymentStatus === "Pending" || b.paymentStatus === "Refunded" || b.paymentMethod === "Cash"))),
      refunds: bookings.filter(b => (b.bookingStatus === "Cancelled" && (b.paymentStatus === "Partial" || b.paymentStatus === "Full") && b.paymentMethod !== "Cash")),
    };

    if (!bookings.length) {
      return res.status(404).json({ message: 'No bookings found for this renter.' });
    }

    res.status(200).json({ success: true, bookings:categorizedBookings, userId: renterId });
  } catch (error) {
    console.error('Error fetching renter bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch a user's booking
exports.getUserBooking = async (req, res) => {
  const renterId = req.user.id;
  const vehicleId = req.params.vehicleId;

  try {
    const booking = await Booking.findOne({
      renterId,
      vehicleId,
      bookingStatus: { $ne: 'Cancelled' }
    }).populate('vehicleId ownerId');

    if (!booking) {
      return res.status(404).json({ message: 'No active booking found for this vehicle.' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch booking. Please try again later.' });
  }
};

exports.cancelUserBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const renter = await User.findById(userId);

    // Find the booking
    // const booking = await Booking.findById(bookingId);
    const booking = await Booking.findById(bookingId)
      .populate('vehicleId')
      .populate({
        path: 'ownerId',
        populate: { path: 'kycId' } // Get owner details along with KYC
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const vehicle = await Vehicle.findById(booking.vehicleId._id);

    const ownerId = vehicle.ownerId._id;
    const owner = await Owner.findById(ownerId);
    // Check if the user is authorized
    if (String(booking.renterId) !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // If already cancelled, return response
    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Determine if cancellation fee applies
    let cancellationFee = 0;
    if (booking.bookingStatus === 'Confirmed') {
      cancellationFee = (booking.amountDue + booking.amountPaid) * 0.05; // 5% fee only if booking was confirmed
    }

    // Update booking status and cancellation fee
    booking.bookingStatus = 'Cancelled';
    booking.cancellationFee = cancellationFee;
    booking.updatedAt = Date.now();

    // Update payment status if applicable
    let refundAmount = booking.amountPaid;
    if (booking.amountPaid > 0) {
      refundAmount = booking.amountPaid - cancellationFee;
      if (refundAmount <= 0) {
        booking.paymentStatus = 'Refunded';
      }
    }

    await booking.save();

    // Send notification to the owner
    const notification = new Notification({
      recipientId: booking.ownerId._id,
      recipientModel: 'Owner',
      message: `Booking for vehicle ${vehicle.name} has been Cancelled.`,
      type: 'booking',
      priority: 'high'
    });

    await notification.save();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: owner.email,
      subject: `Booking Cancellation Notice for Your Vehicle: ${vehicle.name}`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #333;
                background-color: #f4f4f4;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .header h1 {
                color: #d9534f;
              }
              .content {
                font-size: 16px;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #777;
                text-align: center;
              }
              .button {
                background-color: #d9534f;
                color: white;
                padding: 10px 20px;
                text-align: center;
                display: inline-block;
                font-size: 16px;
                border-radius: 5px;
                text-decoration: none;
              }
              .button:hover {
                background-color: #c9302c;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Cancelled</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${owner.name}</strong>,</p>
                
                <p>We regret to inform you that a booking for your vehicle, <strong>${vehicle.name}</strong>, has been cancelled by the renter, <strong>${renter.name}</strong>.</p>
    
                <p><strong>Booking Details:</strong></p>
                <ul>
                  <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
                  <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
                  <li><strong>Cancellation Fee (if applicable):</strong> Rs. ${cancellationFee}</li>
                  <li><strong>Refund Amount (if applicable):</strong> Rs. ${refundAmount}</li>
                </ul>
    
                <p>We apologize for any inconvenience this may have caused. You may check your bookings and availability on your dashboard.</p>
    
                <p><a href="${process.env.BASE_URL}/ownerbookings" class="button">View Bookings</a></p>
    
                <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
    
                <p>Best regards,<br/>The RentRide Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2025 RentRide. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'Booking cancelled successfully',
      cancellationFee,
      refundAmount,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.acceptRevisionBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find the booking by ID
    // const booking = await Booking.findById(bookingId);
    const booking = await Booking.findById(bookingId)
      .populate('vehicleId')
      .populate({
        path: 'ownerId',
        populate: { path: 'kycId' } // Get owner details along with KYC
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const renter = await User.findById(booking.renterId);
    if (renter.blockStatus == "blocked") {
      return res.status(400).json({ message: 'You are blocked by the admin to perform any activities.' });
    }

    if (booking.ownerId.blockStatus == "blocked") {
      return res.status(400).json({ message: 'The owner was blocked by the admin due to suspicious activity.' });
    }

    // Check if the booking is in "RevisionRequired" status
    if (booking.bookingStatus !== 'RevisionRequired') {
      return res.status(400).json({ message: 'Booking is not in revision state' });
    }

    // Check for overlapping confirmed bookings for the same vehicle
    const overlappingBookings = await Booking.find({
      vehicleId: booking.vehicleId._id,
      bookingStatus: 'Confirmed',
      _id: { $ne: bookingId }, // Exclude the current booking
      $or: [
        { startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } },
        { startDate: { $gte: booking.startDate }, startDate: { $lte: booking.endDate } }
      ]
    });

    if (overlappingBookings.length > 0) {
      booking.bookingStatus = 'Pending';
      await booking.save();
      return res.status(400).json({ message: 'Sorry, but there has been another booking confirmed with these dates.' });
    }

    // Change the status to "Confirmed"
    booking.bookingStatus = 'Accepted';
    await booking.save();

    // Send email notification to the renter
    const vehicle = await Vehicle.findById(booking.vehicleId._id);
    // const renter = await User.findById(booking.renterId);

    // // Check if a chat already exists for the given bookingId
    // const existingChat = await Chat.findOne({ bookingId: booking._id });

    // if (!existingChat) {
    //   // Create a chat for the booking if it doesn't exist
    //   const newChat = new Chat({
    //     bookingId: booking._id,
    //     ownerId: booking.ownerId,
    //     renterId: booking.renterId,
    //     messages: [], // Initialize with an empty messages array
    //     createdAt: Date.now(),
    //   });

    //   await newChat.save();
    // }

    // Send notification to the renter
    await new Notification({
      recipientId: booking.renterId,
      recipientModel: 'User',
      message: `Your booking for ${vehicle.name} has been accepted by the owner. You can now proceed with payment to confirm your booking.`,
      type: 'booking',
      priority: 'high'
    }).save();

    

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: renter.email,
      subject: `Booking Accepted: ${vehicle.name}`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #333;
                background-color: #f4f4f4;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .header h1 {
                color: #4CAF50;
              }
              .content {
                font-size: 16px;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #777;
                text-align: center;
              }
              .button {
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                text-align: center;
                display: inline-block;
                font-size: 16px;
                border-radius: 5px;
                text-decoration: none;
              }
              .button:hover {
                background-color: #45a049;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Accepted</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${renter.name}</strong>,</p>
                <p>Your booking for <strong>${vehicle.name}</strong> has been <strong>accepted</strong> by the owner.</p>
                <p>Please proceed with payment to confirm your booking.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                  <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
                  <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
                  <li><strong>Total Amount Due:</strong> Rs. ${booking.amountDue}</li>
                </ul>
                <p><a href="${process.env.BASE_URL}/myBookings" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Booking</a></p>
                <p>Best regards,<br/>The RentRide Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2025 RentRide. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'Booking revision accepted and status updated to accepted.',
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.requestRefund = async (req, res) => {
  try {
      const { bookingId } = req.params; 
      const { walletName, walletId } = req.body;
      const userId = req.user.id;

      // Find booking by ID and ensure the user owns it
      // const booking = await Booking.findOne({ _id: bookingId, renterId: userId });

      // Fetch booking details and populate vehicle and owner details
      const booking = await Booking.findOne({ _id: bookingId, renterId: userId })
      .populate('vehicleId')
      .populate({
        path: 'ownerId',
        populate: { path: 'kycId' } // Get owner details along with KYC
      });

      if (!booking) {
          return res.status(404).json({ success: false, message: "Booking not found or unauthorized" });
      }

      // Check if the booking is canceled and payment was made: Partial or Full
      if (booking.bookingStatus !== "Cancelled") {
          return res.status(400).json({ success: false, message: "Refund can only be requested for canceled bookings" });
      }

      if (!["Partial", "Full"].includes(booking.paymentStatus)) {
          return res.status(400).json({ success: false, message: "Refund can only be requested if payment was made" });
      }

      // Ensure refund has not already been requested
      if (booking.refundRequest.requested) {
          return res.status(400).json({ success: false, message: "Refund has already been requested" });
      }

      // Validate wallet details
      if (!walletName || !walletId) {
          return res.status(400).json({ success: false, message: "Wallet details are required for refund" });
      }

      // Mark refund as requested with wallet details
      booking.refundRequest = {
          requested: true,
          walletName,
          walletId
      };

      booking.updatedAt = new Date();
      await booking.save(); // Save the updated booking

      return res.status(200).json({
          success: true,
          message: "Refund request submitted successfully",
          booking
      });

  } catch (error) {
      console.error("Error requesting refund:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.updateBookingStatus = async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
  
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
