const User = require('../models/user');
const bcrypt = require('bcrypt');


const getProfile = async (req, res) => {
    try {
      const userId = req.user.id;
    //   console.log(userId)
  
      // Fetch the user from the database
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Send user data 
      return res.json({
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber, 
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };


const updateUser = async (req, res) => {
    const userId = req.user.id; 
    const { name, contactNumber } = req.body;
  
    try {
      if (!name && !contactNumber) {
        return res.status(400).json({ message: "Please provide a name or contact number to update." });
      }
  
      // Create an update object dynamically based on provided fields
      const updateFields = {};
      if (name) updateFields.name = name;
      if (contactNumber) updateFields.contactNumber = contactNumber;
  
      // Update the user's data
      const updatedUser = await User.findByIdAndUpdate(
        userId,           
        { $set: updateFields },
        { new: true, runValidators: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Send back the updated user data
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user data:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };


// Controller function to update password
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; 
  
    try {
      // Find the user by their ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the user's password
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ message: "Password updated successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error. Please try again later." });
    }
  };
  
module.exports = { getProfile, updateUser, changePassword };