const Owner = require('../models/owner'); // Import the Owner model
const KYC = require('../models/kyc'); // Import the Owner model
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

    return res.status(200).json({ message: 'KYC updated successfully', kyc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAllOwners, getOwnerById, updateKyc};
