const crypto = require('crypto');
const nodemailer = require('nodemailer');  // For sending emails
const User = require('../models/user');
const Owner = require('../models/owner');
const Booking = require('../models/Booking');
const Contact = require('../models/contact');
const Vehicle = require('../models/vehicle');
const Notification = require('../models/notification');
const KYC = require('../models/kyc');


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
    // Check if an admin with the given email already exists
    const existingAdmin = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Generate a temporary password for the new admin
    const temporaryPassword = generateTemporaryPassword();

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,  // Store the hashed temporary password
      role: 'admin',
    });

    // Save the new admin to the database
    await newAdmin.save();

    // Set up the email transporter (make sure you have a working email service)
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,  // Sender's email address
      to: email,                    // Recipient's email address
      subject: 'Admin Account Setup', // Email subject
      html: `
        <h1>Welcome to RentRide!!</h1>
        <p>You have been added as an admin. Please use the following temporary password to log in:</p>
        <p><strong>Temporary Password: ${temporaryPassword}</strong></p>
        <p>For security reasons, please change your password after logging in.</p>
      `,
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
      const adminsCount = await User.countDocuments({ role: { $in: ["admin", "superadmin"] } });
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
            recipients = (await User.find({ role: { $in: ['admin', 'superadmin'] } })).map(u => ({ ...u.toObject(), model: 'User' }));
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
  
      // await Notification.insertMany(notifications);
      
      // Save each notification individually to trigger the post hook
    for (const notification of notifications) {
      const newNotification = new Notification(notification);
      await newNotification.save(); // Save individually
    }
  
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
  
  exports.getAllAdmins= async (req, res) => {
    try {
      // Extract query parameters
      const { name, email } = req.query;
      const currentAdmin = req.user;
  
      // Build the filter object dynamically
      const filter = {role: { $in: ['admin', 'superadmin'] }};
      if (name || email) {
        filter.$or = [];
        if (name) {
          filter.$or.push({ name: { $regex: name, $options: 'i' } });
        }
        if (email) {
          filter.$or.push({ email: { $regex: email, $options: 'i' } });
        }
      }
  
      // Fetch users from the database based on the filter
      const users = await User.find(filter, '-password'); // Exclude the password field for security
  
      // Check if users exist
      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No admins found.',
        });
      }
  
      // Respond with the owners data
      return res.status(200).json({
        success: true,
        data: users,
        currentAdmin: {
          id: currentAdmin._id,
          name: currentAdmin.name,
          email: currentAdmin.email,
          role: currentAdmin.role
        }
      });
    } catch (error) {
      // Handle any errors
      console.error('Error fetching admins:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };

  exports.toggleAdminBlock = async (req, res) => {
    try {
      const { adminId } = req.params;
      const { action, reason } = req.body;
      const superAdmin = req.user;
  
      // Verify superadmin role
      if (superAdmin.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Only superadmins can block/unblock admins'
        });
      }
  
      // Find the admin to be blocked/unblocked
      const admin = await User.findById(adminId);
  
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
  
      // Prevent blocking superadmins
      if (admin.role === 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot block a superadmin'
        });
      }
  
      // Prevent self-blocking
      if (admin._id === superAdmin._id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot block yourself'
        });
      }
  
      // Update block status based on action
      if (action === 'block') {
        if (!reason) {
          return res.status(400).json({
            success: false,
            message: 'Block reason is required'
          });
        }
  
        admin.blockStatus = 'blocked';
        admin.blockReason = reason;
        admin.blockedAt = new Date();
        admin.blockInitiatedAt = new Date();
  
        // Create notification for blocked admin
        const notification = new Notification({
          recipientId: admin._id,
          recipientModel: 'User',
          message: `Your admin access has been blocked. Reason: ${reason}`,
          type: 'system',
          priority: 'high'
        });
  
        await notification.save();
  
      } else if (action === 'unblock') {
        admin.blockStatus = 'active';
        admin.blockReason = null;
        admin.blockedAt = null;
        admin.blockInitiatedAt = null;
  
        // Create notification for unblocked admin
        const notification = new Notification({
          recipientId: admin._id,
          recipientModel: 'User',
          message: 'Your admin access has been restored',
          type: 'system',
          priority: 'high'
        });
  
        await notification.save();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "block" or "unblock"'
        });
      }
  
      await admin.save();
  
      // Send email notification
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const emailSubject = action === 'block' ? 'Admin Access Blocked' : 'Admin Access Restored';
      const emailMessage = action === 'block' 
        ? `Your admin access has been blocked. Reason: ${reason}`
        : 'Your admin access has been restored';
  
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: admin.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: ${action === 'block' ? '#dc3545' : '#28a745'}">
              ${emailSubject}
            </h2>
            <p>${emailMessage}</p>
            <p>If you have any questions, please contact the super admin.</p>
          </div>
        `
      });
  
      return res.status(200).json({
        success: true,
        message: `Admin successfully ${action === 'block' ? 'blocked' : 'unblocked'}`,
        data: {
          adminId: admin._id,
          name: admin.name,
          email: admin.email,
          blockStatus: admin.blockStatus,
          blockReason: admin.blockReason,
          blockedAt: admin.blockedAt
        }
      });
  
    } catch (error) {
      console.error('Error in toggleAdminBlock:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while updating admin status'
      });
    }
  };


  exports.getPendingCounts = async (req, res) => {
    try {
      // Get pending vehicle document verifications
      const pendingVehicles = await Vehicle.countDocuments({
        $or: [
          { 'registrationCertificate.status': 'Pending' },
          { 'insuranceCertificate.status': 'Pending' }
        ]
      });
  
      // Get pending KYC count
      const pendingKYC = await KYC.countDocuments({
        $or: [
          { 'documents.profilePicture.status': 'pending' },
          { 'documents.citizenshipFront.status': 'pending' },
          { 'documents.citizenshipBack.status': 'pending' }
        ]
      });
  
      // Get pending queries count
      const pendingQueries = await Contact.countDocuments({
        status: 'Pending'
      });
  
      res.status(200).json({
        success: true,
        data: {
          pendingVehicles,
          pendingKYC,
          pendingQueries,
          totalPending: pendingVehicles + pendingKYC + pendingQueries
        }
      });
  
    } catch (error) {
      console.error('Error fetching pending counts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending counts'
      });
    }
  };