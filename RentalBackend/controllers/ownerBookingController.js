const Booking = require('../models/Booking');
const Notification = require('../models/notification');
const Vehicle = require('../models/vehicle');
const User = require('../models/user');
const Chat = require('../models/Chat'); 
const Owner = require('../models/owner');
const nodemailer = require("nodemailer");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Page = require('../models/page');
const { JSDOM } = require('jsdom');
const { convert } = require('html-to-text');

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
      confirmed: bookings.filter(b => b.bookingStatus === "Confirmed"),
      active: bookings.filter(b => b.bookingStatus === "Active"),
      completed: bookings.filter(b => b.bookingStatus === "Completed"),
      cancelled: bookings.filter(b => (b.bookingStatus === "Cancelled" && (b.paymentStatus === "Pending" || b.paymentStatus === "Refunded"))),
      refunds: bookings.filter(b => (b.bookingStatus === "Cancelled" && (b.paymentStatus === "Partial" || b.paymentStatus === "Full"))),
    };

    if (!bookings.length) {
      return res.status(404).json({ message: 'No bookings found for this owner.' });
    }

    res.status(200).json({ success: true, bookings:categorizedBookings, ownerId: ownerId });
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
    // const booking = await Booking.findById(bookingId).populate('vehicleId').populate('renterId');
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

   // Check if a chat already exists for the given bookingId
   const existingChat = await Chat.findOne({ bookingId: booking._id });

   if (!existingChat) {
     // Create a chat for the booking if it doesn't exist
     const newChat = new Chat({
       bookingId: booking._id,
       ownerId: booking.ownerId,
       renterId: booking.renterId,
       messages: [], // Initialize with an empty messages array
       createdAt: Date.now(),
     });

     await newChat.save();
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
    // const booking = await Booking.findById(bookingId).populate('vehicleId');

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

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    const user = await User.findById(booking.renterId);

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
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking
    // const booking = await Booking.findById(bookingId).populate('vehicleId');
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

    if (booking.bookingStatus === 'Confirmed') {
      return res.status(400).json({ message: 'Booking has already been accepted' });
    }

    if (booking.bookingStatus !== 'Accepted') {
      return res.status(400).json({ message: 'Booking cannot be confirmed unless the status is Pending' });
    }

    booking.bookingStatus = 'Confirmed';
    booking.updatedAt = Date.now();

    // Save the updated booking
    await booking.save();

    // Send a notification to the renter about the confirmation
    const notification = new Notification({
      recipientId: booking.renterId,
      recipientModel: 'User',
      message: `Your booking for ${booking.vehicleId.name} has been confirmed by the owner.`,
      type: 'booking',
      priority: 'high',
    });

    await notification.save();

    // Send confirmation email to the renter
    const user = await User.findById(booking.renterId);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Booking Confirmed for Vehicle: ${booking.vehicleId.name}`,
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
                color: #5bc0de;
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
                background-color: #5bc0de;
                color: white;
                padding: 10px 20px;
                text-align: center;
                display: inline-block;
                font-size: 16px;
                border-radius: 5px;
                text-decoration: none;
              }
              .button:hover {
                background-color: #31b0d5;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Confirmed</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${user.name}</strong>,</p>
                <p>We are pleased to inform you that your booking for the vehicle <strong>${booking.vehicleId.name}</strong> has been confirmed by the owner.</p>
                
                <p><strong>Booking Details:</strong></p>
                <ul>
                  <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
                  <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
                </ul>
                
                <p>We look forward to having you enjoy your ride! For any further queries, feel free to reach out to us.</p>
                
                <p><a href="${process.env.BASE_URL}/myBookings" class="button">View Your Bookings</a></p>
                
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
      success: true,
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setPaymentMethodToCash = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking
    // const booking = await Booking.findById(bookingId).populate('vehicleId');
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

    if (booking.paymentMethod === 'Cash') {
      return res.status(400).json({ message: 'Payment method is already set to Cash' });
    }

    // Update the payment method
    booking.paymentMethod = 'Cash';
    booking.paymentStatus = 'Full';

    booking.updatedAt = Date.now();

    // Save the updated booking
    await booking.save();

    // Send a notification to the renter about the payment method update
    const notification = new Notification({
      recipientId: booking.renterId,
      recipientModel: 'User',
      message: `The owner has set your payment method to Cash for the booking of ${booking.vehicleId.name}.`,
      type: 'payment',
      priority: 'medium',
    });

    await notification.save();

    // Send an email to the renter regarding the payment method change
    const user = await User.findById(booking.renterId);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Payment Method Updated to Cash for ${booking.vehicleId.name}`,
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
                color: #5bc0de;
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
                background-color: #5bc0de;
                color: white;
                padding: 10px 20px;
                text-align: center;
                display: inline-block;
                font-size: 16px;
                border-radius: 5px;
                text-decoration: none;
              }
              .button:hover {
                background-color: #31b0d5;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Payment Method Updated</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${user.name}</strong>,</p>
                <p>The owner has updated the payment method for your booking of <strong>${booking.vehicleId.name}</strong> to <strong>Cash</strong>.</p>
                
                <p><strong>Booking Details:</strong></p>
                <ul>
                  <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
                  <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
                </ul>
                
                <p>Please ensure to carry the necessary cash amount during pickup. If you have any questions, feel free to contact us.</p>
                
                <p><a href="${process.env.BASE_URL}/myBookings" class="button">View Your Bookings</a></p>
                
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
      success: true,
      message: 'Payment method updated to Cash successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




exports.startRental = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking
    // const booking = await Booking.findById(bookingId).populate('vehicleId').populate('renterId');
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

    // Ensure the requesting user is the owner of the vehicle
    if (booking.ownerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this booking' });
    }

    // Check if the booking status is "Confirmed"
    if (booking.bookingStatus !== 'Confirmed') {
      return res.status(400).json({ message: 'Rental can only be started if the booking is Confirmed.' });
    }

    // Check if the current date is on or after the startDate
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0); // Reset time to midnight

    const oneDayAfterStart = new Date(startDate);
    oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);

    if (currentDate < startDate) {
      return res.status(400).json({ message: 'Rental cannot be started before the booking start date.' });
    }

    if (currentDate > oneDayAfterStart) {
      return res.status(400).json({ message: 'Rental can only be started within one day after the start date.' });
    }

    // Update booking status to "Active"
    booking.bookingStatus = 'Active';
    booking.updatedAt = Date.now();

    // Set rental start confirmation fields
    booking.rentalStartConfirmed = true;
    booking.rentalStartTime = Date.now(); // Set the actual rental start time

    await booking.save();

    // Send notification to renter
    const notification = new Notification({
      recipientId: booking.renterId,
      recipientModel: 'User',
      message: `Your rental for ${booking.vehicleId.name} has started.`,
      type: 'booking',
      priority: 'high'
    });

    await notification.save();

    // Send email to renter
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.renterId.email,
      subject: `Rental Started: ${booking.vehicleId.name}`,
      html: `
        <html>
          <body>
            <p>Dear <strong>${booking.renterId.name}</strong>,</p>
            <p>Your rental for <strong>${booking.vehicleId.name}</strong> has officially started.</p>
            <p>Please ensure all agreed terms are followed during the rental period.</p>
            <p><strong>Rental Period:</strong></p>
            <ul>
              <li><strong>Start Date:</strong> ${booking.startDate}</li>
              <li><strong>End Date:</strong> ${booking.endDate}</li>
            </ul>
            <p>Best regards,<br/>The RentRide Team</p>
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

    res.status(200).json({ success: true, message: 'Rental started successfully', booking });

  } catch (error) {
    console.error('Error starting rental:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.endRental = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // const booking = await Booking.findById(bookingId).populate('vehicleId').populate('renterId');
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

    if (booking.bookingStatus !== 'Active') {
      return res.status(400).json({ message: 'Rental can only be ended if the booking is Active.' });
    }

    const currentDate = new Date();
    const endDate = new Date(booking.endDate);

    if (currentDate < endDate) {
      return res.status(400).json({ message: 'Rental cannot be ended before the rental end date.' });
    }

    // Update booking status to "Completed"
    booking.bookingStatus = 'Completed';
    booking.updatedAt = Date.now();

    // Set rental end confirmation fields
    booking.rentalEndConfirmed = true;
    booking.rentalEndTime = Date.now();

    await booking.save();

    // Send notification to renter
    const notification = new Notification({
      recipientId: booking.renterId,
      recipientModel: 'User',
      message: `Your rental for ${booking.vehicleId.name} has ended.`,
      type: 'booking',
      priority: 'high'
    });

    await notification.save();

    // Send email to renter
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.renterId.email,
      subject: `Rental Ended: ${booking.vehicleId.name}`,
      html: `
        <html>
          <body>
            <p>Dear <strong>${booking.renterId.name}</strong>,</p>
            <p>Your rental for <strong>${booking.vehicleId.name}</strong> has officially ended.</p>
            <p>We hope you enjoyed your rental experience.</p>
            <p><strong>Rental Period:</strong></p>
            <ul>
              <li><strong>Start Date:</strong> ${booking.startDate}</li>
              <li><strong>End Date:</strong> ${booking.endDate}</li>
            </ul>
            <p>Best regards,<br/>The RentRide Team</p>
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

    res.status(200).json({ success: true, message: 'Rental ended successfully', booking });

  } catch (error) {
    console.error('Error ending rental:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// exports.downloadContract = async (req, res) => {
//   try {
//     const { bookingId } = req.params;

//     // Fetch booking details
//     const booking = await Booking.findById(bookingId)
//       .populate('vehicleId')
//       .populate('renterId')
//       .populate('ownerId');

//     if (!booking) {
//       return res.status(404).json({ message: 'Booking not found' });
//     }

//     // if (booking.ownerId._id.toString() !== req.user.id) {
//     //   return res.status(403).json({ message: 'Unauthorized: You are not the owner of this booking' });
//     // }

//     // Create a PDF Document
//     const doc = new PDFDocument();
//     const filePath = path.join(__dirname, `../contracts/contract_${bookingId}.pdf`);
//     const writeStream = fs.createWriteStream(filePath);
//     doc.pipe(writeStream);
//     // Header
//     doc.font('Helvetica-Bold').fontSize(22).text('VEHICLE RENTAL AGREEMENT', { align: 'center', underline: true });
//     doc.moveDown(2);

//     doc.font('Helvetica').fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
//     doc.moveDown(2);

//     // Section 1: Parties Involved
//     doc.font('Helvetica-Bold').fontSize(14).text('1. PARTIES:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').fontSize(12).text(`**Owner:** ${booking.ownerId.name} (Email: ${booking.ownerId.email})`);
//     doc.text(`**Renter:** ${booking.renterId.name} (Email: ${booking.renterId.email})`);
//     doc.moveDown(2);

//     // Section 2: Vehicle Information
//     doc.font('Helvetica-Bold').fontSize(14).text('2. VEHICLE INFORMATION:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text(`**Vehicle:** ${booking.vehicleId.name}`);
//     doc.text(`**Type:** ${booking.vehicleId.type}`);
//     doc.text(`**Year:** ${booking.vehicleId.builtYear}`);
//     doc.text(`**Daily Rental Price:** Rs. ${booking.vehicleId.dailyPrice}`);
//     doc.moveDown(2);

//     // Section 3: Rental Terms
//     doc.font('Helvetica-Bold').fontSize(14).text('3. RENTAL TERMS:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text(`**Pickup Date:** ${new Date(booking.startDate).toLocaleDateString()}`);
//     doc.text(`**Drop-off Date:** ${new Date(booking.endDate).toLocaleDateString()}`);
//     doc.text(`**Total Amount Due:** Rs. ${booking.amountDue}`);
//     doc.moveDown(2);

//     // Section 4: Renter Responsibilities
//     doc.font('Helvetica-Bold').fontSize(14).text('4. RENTER RESPONSIBILITIES:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text('- The renter must use the vehicle responsibly and comply with all traffic laws.');
//     doc.text('- The renter must return the vehicle in the same condition as received.');
//     doc.text('- Any damages caused during the rental period will be the responsibility of the renter.');
//     doc.moveDown(1);

//     doc.font('Helvetica-Bold').text('**Required Documents for Vehicle Pickup:**');
//     doc.font('Helvetica').text('- **A valid photocopy of their driver’s license.**');
//     doc.text('- **A photocopy of their citizenship card (or equivalent government-issued ID).**');
//     doc.text('- Failure to provide these documents may result in cancellation of the booking **without a refund.**');
//     doc.moveDown(2);

//     // Section 5: Owner Responsibilities
//     doc.font('Helvetica-Bold').fontSize(14).text('5. OWNER RESPONSIBILITIES:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text('- The owner must ensure the vehicle listing is accurate and up-to-date.');
//     doc.text('- The owner is responsible for ensuring the vehicle meets all legal and safety requirements.');
//     doc.text('- Refunds must be processed promptly according to the agreed policies.');
//     doc.moveDown(2);

//     // Section 6: Booking and Payment
//     doc.font('Helvetica-Bold').fontSize(14).text('6. BOOKING AND PAYMENT:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text('- Bookings are confirmed when the owner accepts the renter’s request.');
//     doc.text('- The renter must pay at least **10% of the total rental fee** to secure the booking.');
//     doc.text('- Additional charges for add-ons (e.g., helmets, child seats) must be communicated before confirmation.');
//     doc.moveDown(2);

//     // Section 7: Cancellation and Refunds
//     doc.font('Helvetica-Bold').fontSize(14).text('7. CANCELLATION AND REFUNDS:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica-Bold').text('**For Renters:**');
//     doc.font('Helvetica').text('- If a renter cancels a confirmed booking, **10% of the total amount** will be deducted as a non-refundable cancellation fee.');
//     doc.text('- The remaining refund will be processed by the owner.');
//     doc.moveDown(1);

//     doc.font('Helvetica-Bold').text('**For Owners:**');
//     doc.font('Helvetica').text('- Owners may cancel a booking before receiving payment without penalty.');
//     doc.text('- If an owner cancels after payment, the full amount must be refunded to the renter.');
//     doc.moveDown(2);

//     // Section 8: Liability and Vehicle Use
//     doc.font('Helvetica-Bold').fontSize(14).text('8. LIABILITY AND VEHICLE USE:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text('- Renters must inspect the vehicle during pickup and report any damages.');
//     doc.text('- The owner must ensure the vehicle is roadworthy and complies with local laws.');
//     doc.text('- **RentRide is not liable** for accidents, damages, or injuries during the rental period.');
//     doc.moveDown(2);

//     // Section 9: Privacy and Data Security
//     doc.font('Helvetica-Bold').fontSize(14).text('9. PRIVACY AND DATA SECURITY:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text('- RentRide collects and processes user data in accordance with its Privacy Policy.');
//     doc.text('- Personal information shared between renters and owners must be handled responsibly.');
//     doc.moveDown(2);

//     // Section 10: Amendments to Terms
//     doc.font('Helvetica-Bold').fontSize(14).text('10. AMENDMENTS TO TERMS:', { underline: true });
//     doc.moveDown(0.5);

//     doc.font('Helvetica').text('- RentRide reserves the right to update these terms at any time.');
//     doc.text('- Users will be notified of significant changes via email or platform notifications.');
//     doc.text('- Continued use of RentRide constitutes acceptance of updated terms.');
//     doc.moveDown(2);

//     // Section 11: Signatures
//     doc.font('Helvetica-Bold').fontSize(14).text('11. SIGNATURES:', { underline: true });
//     doc.moveDown(2);

//     doc.font('Helvetica').text('**Owner Signature:** ___________________________');
//     doc.moveDown(2);
//     doc.text('**Renter Signature:** ___________________________');
//     doc.moveDown(3);

//     doc.font('Helvetica').fontSize(10).text('For inquiries, contact RentRide at rentride@gmail.com.', { align: 'center' });

//     doc.end();

//     writeStream.on('finish', () => {
//       res.download(filePath, `contract_${bookingId}.pdf`, (err) => {
//         if (err) {
//           console.error('Download error:', err);
//           res.status(500).json({ message: 'Error downloading the contract' });
//         }
//       });
//     });

//   } catch (error) {
//     console.error('Error generating contract:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };



exports.downloadContract = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Fetch booking details
    const booking = await Booking.findById(bookingId)
      .populate('vehicleId')
      .populate('renterId')
      .populate('ownerId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Fetch contract content from the Page model (slug: "terms-and-conditions")
    const page = await Page.findOne({ slug: 'terms-and-conditions' });

    if (!page) {
      return res.status(404).json({ message: 'Contract terms not found' });
    }

    // Convert HTML to well-structured text
    const contractText = convert(page.content, {
      wordwrap: 230,
    });

    // console.log(contractText);
    // Create a PDF Document
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(__dirname, `../contracts/contract_${bookingId}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc.font('Helvetica-Bold').fontSize(22).text('VEHICLE RENTAL AGREEMENT', { align: 'center', underline: true });
    doc.moveDown(2);

    doc.font('Helvetica').fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    // Section 1: Parties Involved
    doc.font('Helvetica-Bold').fontSize(14).text('1. PARTIES:', { underline: true });
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(12).text(`**Owner:** ${booking.ownerId.name} (Email: ${booking.ownerId.email})`);
    doc.text(`**Renter:** ${booking.renterId.name} (Email: ${booking.renterId.email})`);
    doc.moveDown(2);

    // Section 2: Vehicle Information
    doc.font('Helvetica-Bold').fontSize(14).text('2. VEHICLE INFORMATION:', { underline: true });
    doc.moveDown(0.5);

    doc.font('Helvetica').text(`**Vehicle:** ${booking.vehicleId.name}`);
    doc.text(`**Type:** ${booking.vehicleId.type}`);
    doc.text(`**Year:** ${booking.vehicleId.builtYear}`);
    doc.text(`**Daily Rental Price:** Rs. ${booking.vehicleId.dailyPrice}`);
    doc.moveDown(2);

    // Section 3: Rental Terms
    doc.font('Helvetica-Bold').fontSize(14).text('3. RENTAL TERMS:', { underline: true });
    doc.moveDown(0.5);

    doc.font('Helvetica').text(`**Pickup Date:** ${new Date(booking.startDate).toLocaleDateString()}`);
    doc.text(`**Drop-off Date:** ${new Date(booking.endDate).toLocaleDateString()}`);
    doc.text(`**Total Amount Due:** Rs. ${booking.amountDue}`);
    doc.moveDown(2);

    // Section 4: Terms and Conditions (Formatted)
    doc.font('Helvetica-Bold').fontSize(14).text('4. TERMS AND CONDITIONS:', { underline: true });
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(10).text(contractText, { align: 'justify' });
    doc.moveDown(2);

    // Section 5: Signatures
    doc.font('Helvetica-Bold').fontSize(14).text('5. SIGNATURES:', { underline: true });
    doc.moveDown(2);

    doc.font('Helvetica').text('**Owner Signature:** ___________________________');
    doc.moveDown(2);
    doc.text('**Renter Signature:** ___________________________');
    doc.moveDown(3);

    doc.font('Helvetica').fontSize(10).text('For inquiries, contact RentRide at rentride@gmail.com.', { align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      res.download(filePath, `contract_${bookingId}.pdf`, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading the contract' });
        }
      });
    });

  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ message: 'Server error' });
  }
};