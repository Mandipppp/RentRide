const User= require('../models/user');
const Notification = require('../models/notification'); 
const nodemailer = require('nodemailer');


const getAllUsers = async (req, res) => {
  try {
    // Extract query parameters
    const { name, email } = req.query;

    // Build the filter object dynamically
    const filter = {role: 'renter'};
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
        message: 'No renters found.',
      });
    }

    // Respond with the owners data
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    // Handle any errors
    console.error('Error fetching renters:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

// Function to get a specific owner's details by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the owner by ID, excluding the password field for security
    const user = await User.findById(id, '-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Respond with the owner data
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

const adminBlockUser = async (req, res) => {
  try {
      const { userId } = req.params;
      const { reason } = req.body; // Admin provides a reason for blocking

      if (!reason) {
          return res.status(400).json({
              success: false,
              message: 'Blocking reason is required.',
          });
      }

      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found.',
          });
      }
      // Check if user is already blocked
      if (user.blockStatus === 'blocked') {
        return res.status(400).json({ message: 'User is already blocked' });
      }

       // Update user block status
       user.blockStatus = 'blocked';
       user.blockReason = reason || 'No reason provided';
       user.blockInitiatedAt = new Date();
       user.blockedAt = new Date();

       await user.save();

       // Send email notification
      const userEmail = user.email;
      const userName = user.name;
      const emailSubject = 'Account Blocked by Admin';

      const emailBody = `
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
                color: #FF0000;
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Account Blocked</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${userName}</strong>,</p>
                
                <p>We regret to inform you that your account has been <strong>blocked</strong> by the admin.</p>
                
                <p><strong>Reason:</strong> ${user.blockReason}</p>
                
                <p>If you believe this is a mistake or need further assistance, please contact our support team.</p>
                
                <p>Best regards,</p>
                <p>The Support Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2025 RentRide. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: '"Account Support" <no-reply@example.com>',
        to: userEmail,
        subject: emailSubject,
        html: emailBody,
      });

      // Create in-app notification
      const notification = new Notification({
        recipientId: userId,
        recipientModel: 'User',
        message: `Your account has been blocked. Reason: ${user.blockReason}`,
        type: 'system',
      });

      await notification.save();

      return res.status(200).json({
          success: true,
          message: `User has been blocked.`,
          data: {
              userId: user._id,
              reason: user.blockReason,
          },
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllUsers, getUserById, adminBlockUser};