const Vehicle = require('../models/vehicle');
const nodemailer = require('nodemailer');
const Notification = require('../models/notification'); // Import the Owner model



const getAllVehicles = async (req, res) => {
  try {
    // Extract query parameters
    const { name, registrationNumber, type, category, status } = req.query;
    
    const filter = {};
    if (name || registrationNumber) {
      filter.$or = [];
      if (name) {
        filter.$or.push({ name: { $regex: name, $options: 'i' } });
      }
      if (registrationNumber) {
        filter.$or.push({ registrationNumber: { $regex: registrationNumber, $options: 'i' } });
      }
    }
    
    if (type) {
      filter.type = type;
    }

    // Filter by category (if provided)
    if (category) {
      filter.category = category;
    }

    // Filter by status (if provided)
    if (status) {
      filter.status = status;
    }

    // Fetch vehicles from the database based on the filter
    const vehicles = await Vehicle.find(filter)
      .populate({
        path: 'ownerId',
        select: 'name email contactNumber', // Include only specific fields from the owner
      })
      .populate({
        path: 'registrationCertificate.verifiedBy insuranceCertificate.verifiedBy',
        select: 'name email', // Include only admin details
      });

    // Check if vehicles exist
    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vehicles found.',
      });
    }

    // Respond with the vehicles data
    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    // Handle any errors
    console.error('Error fetching vehicles:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message,
    });
  }
};

const getVehicleById = async (req, res) => {
    try {
      const { vehicleId } = req.params;
  
      // Fetch the vehicle by ID
      const vehicle = await Vehicle.findById(vehicleId)
        .populate({
          path: 'ownerId',
          select: 'name email contactNumber', // Include only specific fields from the owner
        })
        .populate({
          path: 'registrationCertificate.verifiedBy insuranceCertificate.verifiedBy',
          select: 'name email', // Include only admin details
        });
  
      // Check if the vehicle exists
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found.',
        });
      }
  
      // Respond with the vehicle data
      return res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };
  
  
const verifyVehicle = async (req, res) => {
  const { vehicleId } = req.params; // Vehicle ID from the request
  const {
    registrationStatus,
    insuranceStatus,
    registrationCertificateComments,
    insuranceCertificateComments,
  } = req.body; // Extracted data from the request body

  try {
    // Find the vehicle by ID
    const vehicle = await Vehicle.findById(vehicleId).populate('ownerId');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    let updatedFields = {}; // Dynamically build update fields
    let updated = false;

    // Update registration certificate fields if provided
    if (registrationStatus) {
      updatedFields['registrationCertificate.status'] = registrationStatus;
      updatedFields['registrationCertificate.comments'] =
        registrationCertificateComments || ''; // Set comments or default to empty
      updatedFields['registrationCertificate.verifiedBy'] = req.user.id;
      updatedFields['registrationCertificate.verifiedAt'] = Date.now();
      updated = true;
    }

    // Update insurance certificate fields if provided
    if (insuranceStatus) {
      updatedFields['insuranceCertificate.status'] = insuranceStatus;
      updatedFields['insuranceCertificate.comments'] =
        insuranceCertificateComments || ''; // Set comments or default to empty
      updatedFields['insuranceCertificate.verifiedBy'] = req.user.id;
      updatedFields['insuranceCertificate.verifiedAt'] = Date.now();

      if (insuranceStatus === 'Verified') {
        updatedFields.isInsured = true; // Set the insured status
      }
      updated = true;
    }

    // Update overall verification status if both certificates are verified
    if (registrationStatus === 'Verified' && insuranceStatus === 'Verified') {
      updatedFields.isVerified = true; // Set the vehicle as verified
    }

    // Only update the vehicle if any fields were modified
    if (updated) {
      updatedFields.updatedAt = Date.now(); // Update the modification timestamp
      await Vehicle.findByIdAndUpdate(vehicleId, { $set: updatedFields }, { new: true });
    }

    // Prepare email content
    const ownerEmail = vehicle.ownerId.email;
    const ownerName = vehicle.ownerId.name;
    const emailSubject =
      updatedFields.isVerified
        ? 'Vehicle Verification Successful'
        : 'Vehicle Verification Status Update';
     
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
              <h1>Vehicle Verification Status</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${ownerName}</strong>,</p>
              <p>We would like to inform you about the status of your vehicle verification:</p>
              <p><strong>Status:</strong> ${updatedFields.isVerified ? 'Verified' : 'Pending'} / ${updatedFields.isInsured ? 'Insured' : 'Pending'}</p>
              ${updatedFields.isVerified && updatedFields.isInsured ? `
                <p>Your vehicle has been successfully verified.</p>
              ` : `
                <p>Your vehicle verification is still pending. Please review the status and resubmit the necessary documents if required.</p>
              `}
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,</p>
              <p>The Vehicle Verification Team</p>
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
      from: '"Vehicle Verification" <no-reply@example.com>',
      to: ownerEmail,
      subject: emailSubject,
      html: emailBody,
    });

    // Create a notification for the owner
    const notificationMessage =
      updatedFields.isVerified
        ? 'Your vehicle has been successfully verified.'
        : 'Your vehicle verification status has been updated. Please review the status of your documents.';

    const notification = new Notification({
      recipientId: vehicle.ownerId._id,
      recipientModel: 'Owner',
      message: notificationMessage,
      type: 'vehicle',
    });

    await notification.save();

    return res.status(200).json({ message: 'Vehicle verification updated successfully.', vehicle });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


  

module.exports = { getAllVehicles, getVehicleById, verifyVehicle };
