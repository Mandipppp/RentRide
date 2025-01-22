const Owner = require('../models/owner'); // Import the Owner model

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



module.exports = { getAllOwners, getOwnerById};
