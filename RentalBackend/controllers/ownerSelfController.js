const Owner = require('../models/owner');
const bcrypt = require('bcrypt');


const getOwnerProfile = async (req, res) => {
    try {
      // The Owner ID will be stored in req.Owner by the authenticateToken middleware
      const ownerId = req.user.id;
    //   console.log(OwnerId)
  
      // Fetch the Owner from the database
      const owner = await Owner.findById(ownerId);
  
      if (!owner) {
        return res.status(404).json({ message: "Owner not found." });
      }
  
      // Send Owner data 
      return res.json({
        name: owner.name,
        email: owner.email,
        contactNumber: owner.contactNumber,
        profilePicture: owner.profilePicture,
        citizenshipFront: owner.citizenshipFront,
        citizenshipBack: owner.citizenshipBack,
        walletId: owner.walletId,
        kycStatus: owner.kycStatus,
      });
    } catch (error) {
      console.error("Error fetching Owner profile:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };


  const updateOwner = async (req, res) => {
    const ownerId = req.user.id; 
    const { name, contactNumber, walletId } = req.body;
  
    try {
      // Create an update object dynamically based on provided fields
      const updateFields = {};
      if (name) updateFields.name = name;
      if (contactNumber) updateFields.contactNumber = contactNumber;
      if (walletId) updateFields.walletId = walletId;

  
      // Handle file uploads
      if (req.files && req.files.profilePicture) {
        updateFields.profilePicture = req.files.profilePicture[0].path;
      }
      if (req.files && req.files.citizenshipFront) {
        updateFields.citizenshipFront = req.files.citizenshipFront[0].path;
      }
      if (req.files && req.files.citizenshipBack) {
        updateFields.citizenshipBack = req.files.citizenshipBack[0].path;
      }
  
      // Check if there are fields to update
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: "No fields to update." });
      }
  
      // Update the Owner's data
      const updatedOwner = await Owner.findByIdAndUpdate(
        ownerId,
        { $set: updateFields },
        { new: true, runValidators: true } // Return updated document and validate input
      );
  
      if (!updatedOwner) {
        return res.status(404).json({ message: "Owner not found." });
      }
  
      // Respond with updated owner data
      res.status(200).json(updatedOwner);
    } catch (error) {
      console.error("Error updating Owner data:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };


// Controller function to update password
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const ownerId = req.user.id; 
  
    try {
      // Find the Owner by their ID
      const owner = await Owner.findById(ownerId);
  
      if (!owner) {
        return res.status(404).json({ message: "Owner not found." });
      }
  
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(currentPassword, owner.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the Owner's password
      owner.password = hashedPassword;
      await owner.save();
  
      // Respond with success message
      res.status(200).json({ message: "Password updated successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error. Please try again later." });
    }
  };
  
module.exports = { getOwnerProfile, updateOwner, changePassword };