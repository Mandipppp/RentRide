const Vehicle = require('../models/vehicle');

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
  
  module.exports = { getOwnerVehicles, updateVehicleByOwner };
  