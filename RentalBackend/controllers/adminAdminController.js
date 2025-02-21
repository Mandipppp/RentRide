const crypto = require('crypto');
const nodemailer = require('nodemailer');  // For sending emails
const User = require('../models/user');
const Owner = require('../models/owner');
const Booking = require('../models/Booking');
const Contact = require('../models/contact');
const Vehicle = require('../models/vehicle');
const Notification = require('../models/notification');


const bcrypt = require('bcrypt');

// Temporary password generation function
function generateTemporaryPassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) { // Length of the temporary password
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
}

// Create an admin setup function
exports.addAdmin = async (req, res) => {
  const { name, email } = req.body;

  try {
    // Check if user already exists in the database by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If the user exists, return a response indicating an error
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate a random reset token and set an expiry time of 1 hour
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpiry = Date.now() + 3600000;  // 1 hour expiry for the token

    // Generate a temporary password for the new admin
    const temporaryPassword = generateTemporaryPassword();

    // Hash the temporary password using bcrypt (same as your registerUser function)
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create a new admin user with the reset token, expiry, and the hashed temporary password
    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,  // Store the hashed temporary password
      role: 'admin',
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetExpiry,
    });

    // Save the new admin to the database
    await newAdmin.save();

    // Set up the email transporter (make sure you have a working email service)
    const transporter = nodemailer.createTransport({
      service: 'Gmail',  // You can use other services like SendGrid, Mailgun, etc.
      auth: {
        user: process.env.EMAIL_USER,  // Your Gmail account email
        pass: process.env.EMAIL_PASS,  // Your Gmail account password (or app password)
      },
    });

    // Create the reset link that will be sent to the new admin
    const resetLink = `http://localhost:5173/admin/setup-password/${resetToken}`;

    // Create the email content with the temporary password
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Sender's email address
      to: email,                    // Recipient's email address
      subject: 'Admin Account Setup', // Email subject
      html: `
        <h1>Welcome to Vehicle Rental</h1>
        <p>You have been added as an admin. Please use the following temporary password to log in:</p>
        <p><strong>Temporary Password: ${temporaryPassword}</strong></p>
        <p>Once logged in, you can click the link below to set up your permanent password:</p>
        <a href="${resetLink}">Set Up Your Password</a>
      `, // HTML content for the email
    };

    // Send the email to the new admin
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Error sending email' });
      }
      // If email is sent successfully, return a success message
      res.status(200).json({ message: 'Admin added, email sent with temporary password' });
    });

  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    res.status(500).json({ message: 'Error adding admin', error: error.message });
  }
};

// Controller to handle password setup
exports.setupPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
  
    try {
      // Find user by reset token and check if it has expired
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() }, // Ensure the token hasn't expired
      });
  
      // If no user is found or the token is expired, return an error
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      // Hash the new password using bcrypt with 10 salt rounds (consistent with previous logic)
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Update the user's password and clear the reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;  // Clear the reset token after password change
      user.resetPasswordExpiry = undefined;  // Clear the expiry time
  
      // Save the updated user information to the database
      await user.save();
  
      // Respond with success message
      res.status(200).json({ message: 'Password set successfully' });
    } catch (error) {
      // Handle any errors that occur during the process
      res.status(500).json({ message: 'Error setting password', error: error.message });
    }
  };

  exports.getDashboardStats = async (req, res) => {

    try {
      const adminsCount = await User.countDocuments({ role: "admin" });
      const rentersCount = await User.countDocuments({ role: "renter" });
      const ownersCount = await Owner.countDocuments();
      const vehiclesCount = await Vehicle.countDocuments();
      const bookingsCount = await Booking.countDocuments({ bookingStatus: "Active" });
      const queriesCount = await Contact.countDocuments();
  
      res.json({
        admins: adminsCount,
        renters: rentersCount,
        owners: ownersCount,
        vehicles: vehiclesCount,
        bookings: bookingsCount,
        queries: queriesCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Server error while fetching stats" });
    }
  }

  exports.sendAdminNotification = async (req, res) => {
    try {
      const { message, recipientGroup, type, priority } = req.body;
  
      if (!message || !recipientGroup || !type || !priority) {
        return res.status(400).json({
          success: false,
          message: 'Message and recipient group are required.',
        });
      }
  
      let recipients = [];
      let recipientModel = 'User';
  
      switch (recipientGroup) {
        case 'all':
            const owners = await Owner.find();
            const users = await User.find();
            recipients = [...owners.map(o => ({ ...o.toObject(), model: 'Owner' })), ...users.map(u => ({ ...u.toObject(), model: 'User' }))];
            break;
        case 'users':
            recipients = (await User.find()).map(u => ({ ...u.toObject(), model: 'User' }));
            break;
        case 'owners':
            recipients = (await Owner.find()).map(o => ({ ...o.toObject(), model: 'Owner' }));
            break;
        case 'renters':
            recipients = (await User.find({ role: 'renter' })).map(u => ({ ...u.toObject(), model: 'User' }));
            break;
        case 'admins':
            recipients = (await User.find({ role: 'admin' })).map(u => ({ ...u.toObject(), model: 'User' }));
            break;
        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid recipient group.',
            });
      }
  
      if (recipients.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No recipients found.',
        });
      }
  
      const notifications = recipients.map(user => ({
        recipientId: user._id,
        recipientModel: user.model,
        message,
        type,
        priority,
      }));
  
      await Notification.insertMany(notifications);
  
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const emailMessage = {
        from: process.env.EMAIL_USER,
        subject: 'Admin Notification',
        text: message,
      };
  
      for (const recipient of recipients) {
        if (recipient.email) {
          emailMessage.to = recipient.email;
          await transporter.sendMail(emailMessage);
        }
      }
  
      res.status(200).json({
        success: true,
        message: `Notification sent to ${recipientGroup}.`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server error, unable to send notifications.',
      });
    }
  };
  