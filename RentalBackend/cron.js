const cron = require('node-cron');
const Booking = require('./models/Booking');
const nodemailer = require("nodemailer");
const User = require('./models/user');
const Owner = require('./models/owner');
const Vehicle = require('./models/vehicle');
const Notification = require('./models/notification');

    
const sendEmail = (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    return transporter.sendMail(mailOptions);
};

const createNotification = async (recipientId, recipientModel, message, type, priority = 'medium') => {
    const notification = new Notification({
      recipientId,
      recipientModel,
      message,
      type,
      priority,
    });
    
    await notification.save();
    // console.log('Notification created:', message);
  };

const scheduleCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    // console.log('Cron Job Running at', new Date().toLocaleString());

    try {
      const startBookings = await Booking.find({
        startDate: { $gt: new Date() },
        bookingStatus: 'Confirmed',
      });

      const endBookings = await Booking.find({
        endDate: { $gt: new Date() },
        bookingStatus: 'Active',
      });

      const expiredBookings = await Booking.find({
        startDate: { $lt: new Date(new Date().setDate(new Date().getDate() - 1)) },
        bookingStatus: { $in: ['Pending', 'Accepted', 'RevisionRequired'] },
      });

      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

      // Check start bookings
      for (let booking of startBookings) {
        if (booking.startDate <= oneDayFromNow && !booking.emailSentForStart) {
            const renter = await User.findById(booking.renterId);
            const owner = await Owner.findById(booking.ownerId);
            const vehicle = await Vehicle.findById(booking.vehicleId);
  
            // Send email to the renter about the upcoming start date
            const renterSubject = 'Your Vehicle Booking is Approaching!';
            const renterText = `Hello ${renter.name},\n\nYour rental for the vehicle ${vehicle.name} is starting in less than a day. Please be prepared.`;
            await sendEmail(renter.email, renterSubject, renterText);
  
            // Send email to the owner about the upcoming start date
            const ownerSubject = 'A Vehicle Rental is Starting Soon!';
            const ownerText = `Hello ${owner.name},\n\nThe rental for your vehicle ${vehicle.name} is starting in less than a day. Please ensure everything is ready for the renter.`;
            await sendEmail(owner.email, ownerSubject, ownerText);

            // Create notification for renter about the start date
            const renterMessage = `Your rental for vehicle ${vehicle.name} is starting in less than a day. Please be prepared.`;
            await createNotification(renter._id, 'User', renterMessage, 'booking', 'high');

            // Create notification for owner about the start date
            const ownerMessage = `The rental for your vehicle ${vehicle.name} is starting in less than a day. Please ensure everything is ready for the renter.`;
            await createNotification(owner._id, 'Owner', ownerMessage, 'booking', 'high');
  
            // Mark emails as sent
            booking.emailSentForStart = true;
            await booking.save();
          }
      }

       // Check end bookings
       for (let booking of endBookings) {
        if (booking.endDate <= oneDayFromNow && !booking.emailSentForEnd) {
          const renter = await User.findById(booking.renterId);
          const owner = await Owner.findById(booking.ownerId);
          const vehicle = await Vehicle.findById(booking.vehicleId);


          // Send email to the renter about the upcoming end date
          const renterSubject = 'Your Vehicle Rental is Ending Soon!';
          const renterText = `Hello ${renter.name},\n\nYour rental for the vehicle ${vehicle.name} is ending in less than a day. Please make arrangements for the return.`;
          await sendEmail(renter.email, renterSubject, renterText);

          // Send email to the owner about the upcoming end date
          const ownerSubject = 'A Vehicle Rental is Ending Soon!';
          const ownerText = `Hello ${owner.name},\n\nThe rental for your vehicle ${vehicle.name} is ending in less than a day. Please be ready for the return.`;
          await sendEmail(owner.email, ownerSubject, ownerText);

          //Create notification for renter about the end date
          const renterMessage = `Your rental for vehicle ${vehicle.name} is ending in less than a day. Please make arrangements for the return.`;
          await createNotification(renter._id, 'User', renterMessage, 'booking', 'high');

          // Create notification for owner about the end date
          const ownerMessage = `The rental for your vehicle ${vehicle.name} is ending in less than a day. Please be ready for the return.`;
          await createNotification(owner._id, 'Owner', ownerMessage, 'booking', 'high');

          // Mark emails as sent
          booking.emailSentForEnd = true;
          await booking.save();

        //   console.log(`Booking ID ${booking._id}: End Date is approaching, emails sent.`);
        }
      }

      // Cancel expired bookings
      for (let booking of expiredBookings) {
        const renter = await User.findById(booking.renterId);
        const owner = await Owner.findById(booking.ownerId);
        const vehicle = await Vehicle.findById(booking.vehicleId);

        booking.bookingStatus = 'Cancelled';
        await booking.save();

        // Send cancellation emails
        await sendEmail(renter.email, 'Your Booking has been Cancelled', `Hello ${renter.name},\n\nYour booking for vehicle ${vehicle.name} has been cancelled because it was not confirmed in time.`);
        await sendEmail(owner.email, 'A Booking has been Cancelled', `Hello ${owner.name},\n\nThe booking for your vehicle ${vehicle.name} has been cancelled due to inactivity.`);

        // Create notifications
        await createNotification(renter._id, 'User', `Your booking for vehicle ${vehicle.name} has been cancelled due to inactivity.`, 'booking', 'high');
        await createNotification(owner._id, 'Owner', `A booking for your vehicle ${vehicle.name} has been cancelled due to inactivity.`, 'booking', 'high');
      }
      

    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });
};

module.exports = scheduleCronJobs;
