const Vehicle = require('../models/vehicle'); 

const getAllVehicles = async (req, res) => {
  try {
    // Extract query parameters
    const { name, type, status, category, registrationNumber } = req.query;

    const filter = {};
    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // Case-insensitive partial match for name
    }
    if (type) {
      filter.type = type; // Exact match for type
    }
    if (status) {
      filter.status = status; // Exact match for status
    }
    if (category) {
      filter.category = category; // Exact match for category
    }
    if (registrationNumber) {
      filter.registrationNumber = { $regex: registrationNumber, $options: 'i' }; // Case-insensitive partial match for registrationNumber
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
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

const getVehicleById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Fetch the vehicle by ID
      const vehicle = await Vehicle.findById(id)
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
  
  
  

module.exports = { getAllVehicles, getVehicleById };
