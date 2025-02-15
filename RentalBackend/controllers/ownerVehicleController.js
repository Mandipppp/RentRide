const Vehicle = require('../models/vehicle');
const Owner= require('../models/owner');
const fs = require('fs');
const Booking = require('../models/Booking');
const nodemailer = require("nodemailer");



// Function to delete files
const deleteFiles = (files) => {
  files.forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log(`File deleted: ${file.path}`);
        }
      });
    }
  });
};


const getOwnerVehicles = async (req, res) => {
    try {
      const ownerId  = req.user.id;
  
      // Validate if ownerId is provided
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          message: 'Owner ID is required.',
        });
      }

          // Fetch owner and KYC details separately
        const owner = await Owner.findById(ownerId)
        .select('name email contactNumber kycId') // Include necessary owner details
        .populate({
          path: 'kycId', // Populate KYC details
          select: 'overallStatus', // Select only the overallStatus from KYC
        });

      if (!owner) {
        return res.status(404).json({
          success: false,
          message: 'Owner not found.',
        });
      }
  
      // Fetch vehicles associated with the ownerId
      const vehicles = await Vehicle.find({ ownerId })
        .populate({
          path: 'registrationCertificate.verifiedBy insuranceCertificate.verifiedBy',
          select: 'name email', // Include admin details
        });
  
      // Check if any vehicles were found
      // if (vehicles.length === 0) {
      //   return res.status(404).json({
      //     success: false,
      //     owner: {
      //       name: owner.name,
      //       email: owner.email,
      //       contactNumber: owner.contactNumber,
      //       kyc: owner.kycId,
      //     },
      //     message: 'No vehicles found for the given owner.',
      //   });
      // }
  
      // Respond with the list of vehicles
      return res.status(200).json({
        success: true,
        owner: {
          name: owner.name,
          email: owner.email,
          contactNumber: owner.contactNumber,
          kyc: owner.kycId,
        },
        vehicles,
      });
    } catch (error) {
      console.error('Error fetching vehicles for the owner:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };


  const addVehicle = async (req, res) => {
    const { name, type, category, fuel, transmission, brand, builtYear, mileage, registrationNumber, description, dailyPrice, minRentalPeriod, maxRentalPeriod, features, addOns, condition, pickupLocation, latitude, longitude } = req.body;
  
    try {
      // Validate required files
      // Check if the registration number is already used
      const existingVehicle = await Vehicle.findOne({ registrationNumber });
      if (existingVehicle) {
        return res.status(400).json({ message: 'A vehicle with this registration number is already registered.' });
      }

      if (!req.files.registrationCert || !req.files.insuranceCert || !req.files.pictures) {
        return res.status(400).json({ message: 'Registration certificate, insurance certificate, and vehicle pictures are required.' });
      }
  
      // Validate file sizes
      if (req.files.registrationCert[0].size > 5 * 1024 * 1024) {
        deleteFiles(req.files.registrationCert); // Delete uploaded files
        return res.status(400).json({ message: 'Registration certificate must be less than 5MB.' });
      }
  
      if (req.files.insuranceCert[0].size > 5 * 1024 * 1024) {
        deleteFiles(req.files.insuranceCert); // Delete uploaded files
        return res.status(400).json({ message: 'Insurance certificate must be less than 5MB.' });
      }
  
      for (let picture of req.files.pictures) {
        if (picture.size > 5 * 1024 * 1024) {
          deleteFiles(req.files.pictures);
          return res.status(400).json({ message: 'Each picture must be less than 5MB.' });
        }
      }
  
      // Validate the number of pictures
      if (req.files.pictures.length < 3 || req.files.pictures.length > 5) {
        deleteFiles(req.files.pictures);
        return res.status(400).json({ message: 'You must upload between 3 and 5 pictures.' });
      }
       
      // Get file paths
      const registrationCert = req.files.registrationCert[0].path;
      const insuranceCert = req.files.insuranceCert[0].path;
      const imageUrls = req.files.pictures.map(picture => picture.path);
  
      // Parse addOns and features
      // const parsedAddOns = addOns ? JSON.parse(addOns) : [];
      // Parse and normalize add-ons
      let parsedAddOns = [];
      try {
          if (addOns) {
              parsedAddOns = JSON.parse(addOns)
                  .map(addOn => addOn.toLowerCase().replace(/[-\s]/g, "_")) // Normalize format
                  .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
          }
      } catch (error) {
          return res.status(400).json({ message: 'Invalid add-ons format.' });
      }
      const parsedFeatures = features ? JSON.parse(features) : [];
  
      // Create the vehicle
      const newVehicle = new Vehicle({
        ownerId: req.user.id,
        name,
        type,
        category,
        fuel,
        transmission,
        brand,
        builtYear,
        mileage,
        registrationNumber,
        description,
        dailyPrice,
        minRentalPeriod,
        maxRentalPeriod,
        features: parsedFeatures,
        addOns: parsedAddOns,
        condition,
        imageUrls,
        pickupLocation,
        latitude,
        longitude,
        registrationCertificate: {
          file: registrationCert,
          status: 'Pending',
        },
        insuranceCertificate: {
          file: insuranceCert,
          status: 'Pending',
        },
        isVerified: false,
        isInsured: false,
      });
  
      // Save the vehicle to the database
      await newVehicle.save();
  
      res.status(201).json({
        message: 'Vehicle added successfully!',
        vehicle: {
          id: newVehicle._id,
          name: newVehicle.name,
          type: newVehicle.type,
          category: newVehicle.category,
          dailyPrice: newVehicle.dailyPrice,
          status: newVehicle.status,
          isVerified: newVehicle.isVerified,
          isInsured: newVehicle.isInsured,
        },
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  };
  
  const deleteVehicle = async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const ownerId = req.user.id;
  
      // Find the vehicle by ID and owner ID to ensure the owner is authorized
      const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId });
  
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or unauthorized.',
        });
      }

      // Check if the vehicle has any active bookings with status "Confirmed"
    const activeBookings = await Booking.findOne({
      vehicleId: vehicleId,
      bookingStatus: 'Confirmed',
    });

    if (activeBookings) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle. It has active bookings.',
      });
    }

    // Find bookings that are still in progress but not confirmed
    const pendingBookings = await Booking.find({
      vehicleId: vehicleId,
      bookingStatus: { $in: ['Pending', 'Accepted', 'RevisionRequired'] },
    }).populate('renterId', 'name email');

    // Notify users about the vehicle removal
    for (const booking of pendingBookings) {
      const user = booking.renterId;
      // Update booking status to "Cancelled"
      booking.bookingStatus = 'Cancelled';
      booking.updatedAt = Date.now();
      await booking.save();

      // Create and save notification
      const notification = new Notification({
        recipientId: user._id,
        recipientModel: 'User',
        message: `Your booking for ${vehicle.name} has been canceled as the vehicle has been removed by the owner.`,
        type: 'booking',
        priority: 'high',
      });

      await notification.save();

      // Send email to the user
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Booking Cancellation Notice for ${vehicle.name}`,
        html: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { color: #d9534f; }
                .content { font-size: 16px; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
                .button { background-color: #d9534f; color: white; padding: 10px 20px; text-align: center; display: inline-block; font-size: 16px; border-radius: 5px; text-decoration: none; }
                .button:hover { background-color: #c9302c; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Booking Cancelled</h1>
                </div>
                <div class="content">
                  <p>Dear <strong>${user.name}</strong>,</p>
                  <p>We regret to inform you that your booking for vehicle <strong>${vehicle.name}</strong> has been cancelled because the vehicle has been removed by the owner.</p>
                  <p><strong>Booking Details:</strong></p>
                  <ul>
                    <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
                    <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
                  </ul>
                  <p>We apologize for any inconvenience this may have caused. You may check other available vehicles on our platform.</p>
                  <p><a href="${process.env.BASE_URL}/user/bookings" class="button">View Available Vehicles</a></p>
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
    }
  
      // Collect all files to be deleted
      const filesToDelete = [];
  
      if (vehicle.registrationCertificate && vehicle.registrationCertificate.file) {
        filesToDelete.push({ path: vehicle.registrationCertificate.file });
      }
  
      if (vehicle.insuranceCertificate && vehicle.insuranceCertificate.file) {
        filesToDelete.push({ path: vehicle.insuranceCertificate.file });
      }
  
      if (vehicle.imageUrls && Array.isArray(vehicle.imageUrls)) {
        vehicle.imageUrls.forEach(imageUrl => filesToDelete.push({ path: imageUrl }));
      }
  
      // Delete the files from the filesystem
      deleteFiles(filesToDelete);
  
      // Delete the vehicle from the database
      await Vehicle.deleteOne({ _id: vehicleId, ownerId });
  
      return res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };

  const disableVehicle = async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const ownerId = req.user.id;
  
      // Find the vehicle by ID and owner ID to ensure the owner is authorized
      const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId });
  
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or unauthorized.',
        });
      }
      
      // Find bookings that are still in progress but not confirmed
    const affectedBookings = await Booking.find({
      vehicleId: vehicleId,
      bookingStatus: { $in: ['Pending', 'Accepted', 'RevisionRequired'] },
    }).populate('renterId', 'name email');

    // Cancel bookings and notify users
    for (const booking of affectedBookings) {
      const user = booking.renterId;

      // Update booking status to "Cancelled"
      booking.bookingStatus = 'Cancelled';
      booking.updatedAt = Date.now();
      await booking.save();

      // Create and save notification
      const notification = new Notification({
        recipientId: user._id,
        recipientModel: 'User',
        message: `Your booking for ${vehicle.name} has been cancelled because the vehicle is now under maintenance.`,
        type: 'booking',
        priority: 'high',
      });

      await notification.save();

      // Send email to the user
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Booking Cancellation Notice for ${vehicle.name}`,
        html: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { color: #d9534f; }
                .content { font-size: 16px; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
                .button { background-color: #d9534f; color: white; padding: 10px 20px; text-align: center; display: inline-block; font-size: 16px; border-radius: 5px; text-decoration: none; }
                .button:hover { background-color: #c9302c; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Booking Cancelled</h1>
                </div>
                <div class="content">
                  <p>Dear <strong>${user.name}</strong>,</p>
                  <p>We regret to inform you that your booking for vehicle <strong>${vehicle.name}</strong> has been cancelled because the vehicle is now under maintenance.</p>
                  <p><strong>Booking Details:</strong></p>
                  <ul>
                    <li><strong>Pickup Date:</strong> ${booking.startDate}</li>
                    <li><strong>Drop-off Date:</strong> ${booking.endDate}</li>
                  </ul>
                  <p>We apologize for any inconvenience caused. You may check other available vehicles on our platform.</p>
                  <p><a href="${process.env.BASE_URL}/user/bookings" class="button">View Available Vehicles</a></p>
                  <p>If you have any questions, feel free to contact us.</p>
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
    }
      // Update the status of the vehicle to 'Under Maintenance'
      vehicle.status = 'Under Maintenance';
      await vehicle.save();
  
      return res.status(200).json({
        success: true,
        message: 'Vehicle status updated to "Under Maintenance".',
        vehicle,
      });
    } catch (error) {
      console.error('Error disabling vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };
  
  const enableVehicle = async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const ownerId = req.user.id;
  
      // Find the vehicle by ID and owner ID to ensure the owner is authorized
      const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId });
  
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or unauthorized.',
        });
      }
  
      // Update the status of the vehicle to 'Available'
      vehicle.status = 'Available';
      await vehicle.save();
  
      return res.status(200).json({
        success: true,
        message: 'Vehicle status updated to "Available".',
        vehicle,
      });
    } catch (error) {
      console.error('Error enabling vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };

  
  const updateVehicle = async (req, res) => {
    const ownerId = req.user.id; // The owner ID from the authenticated user
    const { vehicleId } = req.params; 
    const {
      name,
      type,
      category,
      fuel,
      transmission,
      brand,
      builtYear,
      mileage,
      registrationNumber,
      description,
      dailyPrice,
      minRentalPeriod,
      maxRentalPeriod,
      features,
      condition,
      status,
      pickupLocation,
      latitude,
      longitude,
      addOns,
    } = req.body;
  
    try {
      // Find the vehicle and ensure it belongs to the owner
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found." });
      }
  
      if (vehicle.ownerId.toString() !== ownerId) {
        return res.status(403).json({ message: "You are not authorized to update this vehicle." });
      }
  
      // Update vehicle-related fields
      const vehicleUpdateFields = {};
      if (name) vehicleUpdateFields.name = name;
      if (type) vehicleUpdateFields.type = type;
      if (category) vehicleUpdateFields.category = category;
      if (fuel) vehicleUpdateFields.fuel = fuel;
      if (transmission) vehicleUpdateFields.transmission = transmission;
      if (brand) vehicleUpdateFields.brand = brand;
      if (builtYear) vehicleUpdateFields.builtYear = builtYear;
      if (mileage) vehicleUpdateFields.mileage = mileage;
      if (registrationNumber) vehicleUpdateFields.registrationNumber = registrationNumber;
      if (description) vehicleUpdateFields.description = description;
      if (dailyPrice) vehicleUpdateFields.dailyPrice = dailyPrice;
      if (minRentalPeriod) vehicleUpdateFields.minRentalPeriod = minRentalPeriod;
      if (maxRentalPeriod) vehicleUpdateFields.maxRentalPeriod = maxRentalPeriod;
      // if (features) vehicleUpdateFields.features = features;
      if (condition) vehicleUpdateFields.condition = condition;
      if (status) vehicleUpdateFields.status = status;
      if (pickupLocation) vehicleUpdateFields.pickupLocation = pickupLocation;
      if (latitude) vehicleUpdateFields.latitude = latitude;
      if (longitude) vehicleUpdateFields.longitude = longitude;
       // Parse and update addOns if provided
    if (addOns) {
      try {
        vehicleUpdateFields.addOns = JSON.parse(addOns);
      } catch (err) {
        return res.status(400).json({ message: "Invalid format for addOns field." });
      }
    }
    if (features) {
      try {
        vehicleUpdateFields.features = JSON.parse(features);
      } catch (err) {
        return res.status(400).json({ message: "Invalid format for features field." });
      }
    }
  
      // Handle file uploads for registration and insurance certificates
      const documentUpdateFields = {};
      const updatedFields = []; // To track which documents are updated
  
      if (req.files && req.files.registrationCert) {
        documentUpdateFields['registrationCertificate.file'] = req.files.registrationCert[0].path;
        documentUpdateFields['registrationCertificate.status'] = 'Pending'; // Reset status
        documentUpdateFields['registrationCertificate.comments'] = ''; // Clear comments
        updatedFields.push('registrationCertificate');
      }
      if (req.files && req.files.insuranceCert) {
        documentUpdateFields['insuranceCertificate.file'] = req.files.insuranceCert[0].path;
        documentUpdateFields['insuranceCertificate.status'] = 'Pending'; // Reset status
        documentUpdateFields['insuranceCertificate.comments'] = ''; // Clear comments
        updatedFields.push('insuranceCertificate');
      }
  
      // Update imageUrls
      if (req.files && req.files.pictures) {
        const imageUrls = req.files.pictures.map((file) => file.path);
        if (imageUrls.length >= 3 && imageUrls.length <= 5) {
          vehicleUpdateFields.imageUrls = imageUrls;
        } else {
          return res.status(400).json({
            message: "A minimum of 3 and a maximum of 5 images are required for imageUrls.",
          });
        }
      }

      vehicleUpdateFields.updatedAt = Date.now();
  
      // Update vehicle details in the database
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        {
          $set: { ...vehicleUpdateFields, ...documentUpdateFields },
        },
        { new: true, runValidators: true } // Return updated document and validate input
      );
  
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Failed to update the vehicle." });
      }
  
      res.status(200).json({
        message: "Vehicle details updated successfully.",
        updatedVehicle,
      });
    } catch (error) {
      console.error("Error updating Vehicle data:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  

module.exports = { getOwnerVehicles, updateVehicle, addVehicle, deleteVehicle, disableVehicle, enableVehicle };
  