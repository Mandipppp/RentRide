const Owner = require('../models/owner'); // Import the Owner model
const KYC = require('../models/kyc');
const Notification = require('../models/notification'); 

const nodemailer = require('nodemailer');


const getAllOwners = async (req, res) => {
  try {
    // Extract query parameters
    const { name, email } = req.query;

    // Build the filter object dynamically
    const filter = {};
    if (name || email) {
      filter.$or = [];
      if (name) {
        filter.$or.push({ name: { $regex: name, $options: 'i' } });
      }
      if (email) {
        filter.$or.push({ email: { $regex: email, $options: 'i' } });
      }
    }

    // Fetch owners from the database based on the filter
    const owners = await Owner.find(filter, '-password')
    .populate({
      path: 'kycId',
      select: '-ownerId -__v', // Exclude fields not needed in the response
    }); 

    // Check if owners exist
    if (!owners || owners.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No owners found.',
      });
    }

    // Respond with the owners data
    return res.status(200).json({
      success: true,
      data: owners,
    });
  } catch (error) {
    // Handle any errors
    console.error('Error fetching owners:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

// Function to get a specific owner's details by ID
const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the owner by ID, excluding the password field for security
    const owner = await Owner.findById(id, '-password')
    .populate({
      path: 'kycId',
      select: '-ownerId -__v', // Exclude fields not needed in the response
    });
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found.',
      });
    }

    // Respond with the owner data
    return res.status(200).json({
      success: true,
      data: owner,
    });
  } catch (error) {
    console.error('Error fetching owner details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

const updateKyc = async (req, res) => {
  const { ownerId } = req.params;
  const updates = req.body;

  try {
    const kyc = await KYC.findOne({ ownerId }).populate('ownerId');
    if (!kyc) return res.status(404).json({ message: 'KYC record not found' });

    // Loop through each section in the request body and update the document
    Object.keys(updates).forEach((section) => {
      if (kyc.documents[section]) {
        kyc.documents[section].status = updates[section].status;
        kyc.documents[section].comments = updates[section].reason || '';
      }
    });

    // Update overallStatus based on all sections
    const allStatuses = Object.values(kyc.documents).map(doc => doc.status);
    kyc.overallStatus = allStatuses.every(stat => stat === 'verified')
      ? 'verified'
      : allStatuses.some(stat => stat === 'rejected')
      ? 'rejected'
      : 'pending';

    kyc.updatedAt = Date.now(); // Update the timestamp

    await kyc.save();

    // Prepare email content
    const ownerEmail = kyc.ownerId.email;
    const ownerName = kyc.ownerId.name;
    const emailSubject =
      kyc.overallStatus === 'verified'
        ? 'KYC Verification Successful'
        : kyc.overallStatus === 'rejected'
        ? 'KYC Verification Rejected'
        : 'KYC Verification Pending';
     
    let emailBody = `
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
              <h1>KYC Verification Status</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${ownerName}</strong>,</p>
              
              <p>We would like to inform you about the status of your KYC verification:</p>
              
              <p><strong>Status:</strong> ${kyc.overallStatus.charAt(0).toUpperCase() + kyc.overallStatus.slice(1)}</p>
              
              ${kyc.overallStatus === 'verified' ? `
                <p>Your KYC verification has been successfully completed. You can now enjoy all the benefits of a verified account.</p>
              ` : kyc.overallStatus === 'rejected' ? `
                <p>Your KYC verification was rejected. Please review the comments provided and resubmit the required documents.</p>
              ` : `
                <p>Your KYC verification is still pending. We are processing your documents, and we will notify you once the verification is completed.</p>
              `}
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Best regards,</p>
              <p>The KYC Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 RentRide. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    // Send email notification
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    await transporter.sendMail({
      from: '"KYC Verification" <no-reply@example.com>',
      to: ownerEmail,
      subject: emailSubject,
      html: emailBody,
    });

    // Create a notification for the owner
    const notificationMessage =
      kyc.overallStatus === 'verified'
        ? 'Your KYC verification has been successfully completed.'
        : kyc.overallStatus === 'rejected'
        ? 'Your KYC verification was rejected. Please review the comments and resubmit your documents.'
        : 'Your KYC verification is still pending. We will notify you once it is completed.';

    const notification = new Notification({
      recipientId: ownerId,
      recipientModel: 'Owner',
      message: notificationMessage,
      type: 'kyc',
    });

    await notification.save();

    return res.status(200).json({ message: 'KYC updated successfully with notification.', kyc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const adminBlockOwner = async (req, res) => {
  try {
      const { ownerId } = req.params;
      const { reason } = req.body; // Admin provides a reason for blocking

      if (!reason) {
          return res.status(400).json({
              success: false,
              message: 'Blocking reason is required.',
          });
      }

      // Find the user by ID
      const owner = await Owner.findById(ownerId);
      if (!owner) {
          return res.status(404).json({
              success: false,
              message: 'Owner not found.',
          });
      }
      // Check if user is already blocked
      if (owner.blockStatus === 'blocked') {
        return res.status(400).json({ message: 'Owner is already blocked' });
      }

       // Update user block status
       owner.blockStatus = 'blocked';
       owner.blockReason = reason || 'No reason provided';
       owner.blockInitiatedAt = new Date();
       owner.blockedAt = new Date();

       await owner.save();

       // Send email notification
      const ownerEmail = owner.email;
      const ownerName = owner.name;
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
                <p>Dear <strong>${ownerName}</strong>,</p>
                
                <p>We regret to inform you that your account has been <strong>blocked</strong> by the admin.</p>
                
                <p><strong>Reason:</strong> ${owner.blockReason}</p>
                
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
        to: ownerEmail,
        subject: emailSubject,
        html: emailBody,
      });

      // Create in-app notification
      const notification = new Notification({
        recipientId: ownerId,
        recipientModel: 'Owner',
        message: `Your account has been blocked. Reason: ${owner.blockReason}`,
        type: 'system',
      });

      await notification.save();

      return res.status(200).json({
          success: true,
          message: `owner has been blocked.`,
          data: {
              ownerId: owner._id,
              reason: owner.blockReason,
          },
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllOwners, getOwnerById, updateKyc, adminBlockOwner};
