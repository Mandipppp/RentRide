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
    const { name, type, category, fuel, transmission, brand, builtYear, mileage, registrationNumber, description, dailyPrice, minRentalPeriod, maxRentalPeriod, features, addOns, condition, pickupLocation, latitude, longitude } = req.body;
  
    try {
      // Validate required files
      if (!req.files.registrationCert || !req.files.insuranceCert || !req.files.pictures) {
        return res.status(400).json({ message: 'Registration certificate, insurance certificate, and vehicle pictures are required.' });
      }
  
      // Validate file sizes
      if (req.files.registrationCert[0].size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Registration certificate must be less than 5MB.' });
      }
  
      if (req.files.insuranceCert[0].size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Insurance certificate must be less than 5MB.' });
      }
  
      for (let picture of req.files.pictures) {
        if (picture.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: 'Each picture must be less than 5MB.' });
        }
      }
  
      // Validate the number of pictures
      if (req.files.pictures.length < 3 || req.files.pictures.length > 5) {
        return res.status(400).json({ message: 'You must upload between 3 and 5 pictures.' });
      }
  
      // Check if the registration number is already used
      const existingVehicle = await Vehicle.findOne({ registrationNumber });
      if (existingVehicle) {
        return res.status(400).json({ message: 'A vehicle with this registration number is already registered.' });
      }
  
      // Get file paths
      const registrationCert = req.files.registrationCert[0].path;
      const insuranceCert = req.files.insuranceCert[0].path;
      const imageUrls = req.files.pictures.map(picture => picture.path);
  
      // Parse addOns and features
      const parsedAddOns = addOns ? JSON.parse(addOns) : [];
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
  