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
      upcoming: bookings.filter(b => ["Pending", "Accepted", "RevisionRequired"].includes(b.bookingStatus)),
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

    // Prepare notification message based on booking status
    let notificationMessage = `Your booking for ${booking.vehicleId.name} has been accepted by the owner. You can now proceed with payment to confirm your booking.`;
    let emailSubject = `Booking Accepted: ${booking.vehicleId.name}`;
    let emailBody = `
      <p>Dear <strong>${booking.renterId.name}</strong>,</p>
      <p>Your booking for <strong>${booking.vehicleId.name}</strong> has been <strong>accepted</strong> by the owner.</p>
      <p>Please proceed with payment to confirm your booking.</p>
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
        <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
        <li><strong>Total Amount Due:</strong> Rs. ${newTotalPrice}</li>
      </ul>
      <p><a href="${process.env.BASE_URL}/myBookings" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Booking</a></p>
      <p>Best regards,<br/>The RentRide Team</p>
    `;

    if (booking.bookingStatus === 'RevisionRequired') {
      notificationMessage = `Your booking for ${booking.vehicleId.name} has been accepted, but some add-ons were not approved. Please review the changes.`;
      emailSubject = `Booking Accepted with Revisions: ${booking.vehicleId.name}`;
      emailBody = `
        <p>Dear <strong>${booking.renterId.name}</strong>,</p>
        <p>Your booking for <strong>${booking.vehicleId.name}</strong> has been <strong>accepted</strong>, but some add-ons were not approved. Please review the changes.</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
          <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
          <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
          <li><strong>Total Amount Due:</strong> Rs. ${newTotalPrice}</li>
        </ul>
        <p><a href="${process.env.BASE_URL}/myBookings" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Changes</a></p>
        <p>Best regards,<br/>The RentRide Team</p>
      `;
    }
    // Send notification to the renter
    const notification = new Notification({
      recipientId: booking.renterId,
      recipientModel: 'User',
      message: notificationMessage,
      type: 'booking',
      priority: 'high'
    });

    await notification.save();

    // Send email to the renter
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.renterId.email,
      subject: emailSubject,
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
                color: #28a745;
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
                background-color: #28a745;
                color: white;
                padding: 10px 20px;
                text-align: center;
                display: inline-block;
                font-size: 16px;
                border-radius: 5px;
                text-decoration: none;
              }
              .button:hover {
                background-color: #218838;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${emailSubject}</h1>
              </div>
              <div class="content">
                ${emailBody}
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

    res.status(200).json({ success: true, message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('vehicleId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this booking' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    const user = await User.findById(booking.renterId);


    // Calculate cancellation fee (10% of amountDue if payment is already made)
    let cancellationFee = 0;

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

    // Send notification to the renter
    const notification = new Notification({
      recipientId: booking.renterId,
      recipientModel: 'User',
      message: `Your booking for ${booking.vehicleId.name} has been cancelled by the owner.`,
      type: 'booking',
      priority: 'high'
    });

    await notification.save();

    
    const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Booking Cancellation Notice for the Vehicle: ${booking.vehicleId.name}`,
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
                    <p>Dear <strong>${user.name}</strong>,</p>
                    
                    <p>We regret to inform you that your booking for vehicle, <strong>${booking.vehicleId.name}</strong>, has been cancelled by the owner.</p>
        
                    <p><strong>Booking Details:</strong></p>
                    <ul>
                      <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
                      <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
                      <li><strong>Refund Amount (if applicable):</strong> Rs. ${refundAmount}</li>
                    </ul>
        
                    <p>We apologize for any inconvenience this may have caused. You may check your bookings on your bookings page.</p>
        
                    <p><a href="${process.env.BASE_URL}/myBookings" class="button">View Bookings</a></p>
        
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
      success: true,
      message: 'Booking cancelled successfully',
      cancellationFee,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
