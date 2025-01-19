const User= require('../models/user');

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

module.exports = { getAllUsers, getUserById};