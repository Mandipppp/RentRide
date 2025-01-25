const Vehicle = require('../models/vehicle');
const Owner= require('../models/owner');


const getOwnerVehicles = async (req, res) => {
    try {
      const { ownerId } = req.user.id;
  
      // Validate if ownerId is provided
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          message: 'Owner ID is required.',
        });
      }
  
      // Fetch vehicles associated with the ownerId
      const vehicles = await Vehicle.find({ ownerId })
        .populate({
          path: 'ownerId',
          select: 'name email contactNumber', // Include owner details
        })
        .populate({
          path: 'registrationCertificate.verifiedBy insuranceCertificate.verifiedBy',
          select: 'name email', // Include admin details
        });
  
      // Check if any vehicles were found
      if (vehicles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No vehicles found for the given owner.',
        });
      }
  
      // Respond with the list of vehicles
      return res.status(200).json({
        success: true,
        data: vehicles,
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
  const {
    name,
    type,
    category,
    builtYear,
    mileage,
    description,
    dailyPrice,
    minRentalPeriod,
    maxRentalPeriod,
    features,
    addOns,
    condition,
    pickupLocation,
    latitude,
    longitude,
  } = req.body;

  const { ownerId } = req.user.id;

  try {
    // Validate required files
    if (!req.files || !req.files.registrationCert || !req.files.insuranceCert || !req.files.pictures) {
      return res.status(400).json({
        message: 'Registration certificate, insurance certificate, and at least one picture are required.',
      });
    }

    // Validate individual file sizes
    if (req.files.registrationCert[0].size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Registration certificate must be less than 5MB.' });
    }

    if (req.files.insuranceCert[0].size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Insurance certificate must be less than 5MB.' });
    }

    req.files.pictures.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Each image must be less than 5MB.' });
      }
    });

    // Check if owner exists
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found.' });
    }

    // Prepare file paths
    const registrationCert = req.files.registrationCert[0].path;
    const insuranceCert = req.files.insuranceCert[0].path;
    const imageUrls = req.files.pictures.map((file) => file.path);

    // Validate required fields
    if (!name || !type || !category || !builtYear || !dailyPrice || !pickupLocation) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Create a new vehicle
    const newVehicle = new Vehicle({
      ownerId,
      name,
      type,
      category,
      builtYear,
      mileage,
      description,
      dailyPrice,
      minRentalPeriod,
      maxRentalPeriod,
      features,
      addOns,
      condition,
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
      imageUrls,
    });

    // Save the vehicle to the database
    await newVehicle.save();

    res.status(201).json({
      message: 'Vehicle added successfully!',
      vehicle: newVehicle,
    });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

  
  const updateVehicleByOwner = async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const ownerId = req.user.id;
      const allowedFields = [
        'name',
        'description',
        'dailyPrice',
        'features',
        'addOns',
        'imageUrls',
        'pickupLocation',
        'status',
        'condition',
        'mileage',
        'latitude',
        'longitude',
      ];
  
      // Filter the fields that the owner is trying to update
      const updates = {};
      for (const key of Object.keys(req.body)) {
        if (allowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      }
  
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update.',
        });
      }
  
      // Update the vehicle if it belongs to the owner
      const updatedVehicle = await Vehicle.findOneAndUpdate(
        { _id: vehicleId, ownerId }, // Ensure the vehicle belongs to the owner
        { $set: updates },
        { new: true } // Return the updated document
      );
  
      if (!updatedVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or unauthorized.',
        });
      }
  
      return res.status(200).json({
        success: true,
        data: updatedVehicle,
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };
  
  module.exports = { getOwnerVehicles, updateVehicleByOwner, addVehicle };
  