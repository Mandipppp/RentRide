const Owner = require('../models/owner');
const KYC = require('../models/kyc');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');


const getOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Fetch the Owner from the database and populate KYC details
    const owner = await Owner.findById(ownerId).populate('kycId');

    if (!owner) {
      return res.status(404).json({ message: "Owner not found." });
    }

    // Extract KYC details if they exist
    const kyc = owner.kycId;

    // Send Owner and KYC data
    return res.json({
      name: owner.name,
      email: owner.email,
      contactNumber: owner.contactNumber,
      walletId: owner.walletId,
      kycStatus: kyc ? kyc.overallStatus : "No KYC submitted",
      kycDetails: kyc
        ? {
            profilePicture: kyc.documents.profilePicture.file,
            profilePictureStatus: kyc.documents.profilePicture.status,
            profilePictureComment: kyc.documents.profilePicture.comments,
            citizenshipFront: kyc.documents.citizenshipFront.file,
            citizenshipFrontStatus: kyc.documents.citizenshipFront.status,
            citizenshipFrontComment: kyc.documents.citizenshipFront.comments,
            citizenshipBack: kyc.documents.citizenshipBack.file,
            citizenshipBackStatus: kyc.documents.citizenshipBack.status,
            citizenshipBackComment: kyc.documents.citizenshipBack.comments,
          }
        : null,
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
    // Update owner-related fields
    const ownerUpdateFields = {};
    if (name) ownerUpdateFields.name = name;
    if (contactNumber) ownerUpdateFields.contactNumber = contactNumber;
    if (walletId) ownerUpdateFields.walletId = walletId;

    // Update owner data
    const updatedOwner = await Owner.findByIdAndUpdate(
      ownerId,
      { $set: ownerUpdateFields },
      { new: true, runValidators: true }
    );

    if (!updatedOwner) {
      return res.status(404).json({ message: "Owner not found." });
    }

    // Update KYC-related fields
    const kycUpdateFields = {};
    const updatedFields = [];

    if (req.files && req.files.profilePicture) {
      kycUpdateFields['documents.profilePicture.file'] = req.files.profilePicture[0].path;
      kycUpdateFields['documents.profilePicture.status'] = 'pending'; // Reset status
      kycUpdateFields['documents.profilePicture.comments'] = ''; // Clear comments
      updatedFields.push('profilePicture');
    }
    if (req.files && req.files.citizenshipFront) {
      kycUpdateFields['documents.citizenshipFront.file'] = req.files.citizenshipFront[0].path;
      kycUpdateFields['documents.citizenshipFront.status'] = 'pending'; // Reset status
      kycUpdateFields['documents.citizenshipFront.comments'] = ''; // Clear comments
      updatedFields.push('citizenshipFront');
    }
    if (req.files && req.files.citizenshipBack) {
      kycUpdateFields['documents.citizenshipBack.file'] = req.files.citizenshipBack[0].path;
      kycUpdateFields['documents.citizenshipBack.status'] = 'pending'; // Reset status
      kycUpdateFields['documents.citizenshipBack.comments'] = ''; // Clear comments
      updatedFields.push('citizenshipBack');
    }

    if (Object.keys(kycUpdateFields).length > 0) {
      // Ensure overall status is also updated to pending if any field is changed
      kycUpdateFields.overallStatus = 'pending';
      const updatedKYC = await KYC.findOneAndUpdate(
        { ownerId },
        { $set: kycUpdateFields },
        { new: true, runValidators: true }
      );

      if (!updatedKYC) {
        return res.status(404).json({ message: "KYC record not found." });
      }
    }

    res.status(200).json({ message: "Owner and KYC details updated successfully." });
  } catch (error) {
    console.error("Error updating Owner data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


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

  const getOwnerStats = async (req, res) => {
    try {
      const ownerId = req.user.id;
  
      const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
      // Fetch total number of vehicles owned
      const totalVehicles = await Vehicle.countDocuments({ 
        ownerId,
        status: { $ne: 'Deleted' }
      });
  
      // Fetch total number of pending bookings
      const totalPendingBookings = await Booking.countDocuments({ ownerId, bookingStatus: 'Pending' });
  
      // Fetch total earnings
      const totalEarningsData = await Booking.aggregate([
        { $match: { ownerId: ownerObjectId, bookingStatus: 'Completed' } },
        { $group: { _id: null, totalEarnings: { $sum: "$amountPaid" } } }
      ]);
      
      const totalEarnings = totalEarningsData.length > 0 ? totalEarningsData[0].totalEarnings : 0;
  
      res.status(200).json({
        totalVehicles,
        totalPendingBookings,
        totalEarnings
      });
    } catch (error) {
      console.error("Error fetching owner stats:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };

  const checkKycRejection = async (req, res) => {
    try {
      const ownerId = req.user.id;
  
      // Find the owner's KYC document
      const kycDoc = await KYC.findOne({ ownerId });
  
      if (!kycDoc) {
        return res.status(200).json({ 
          hasRejectedDocuments: false,
          message: "No KYC documents found" 
        });
      }
  
      // Check if any document has a rejected status
      const hasRejectedDocuments = 
        kycDoc.documents.citizenshipFront.status === 'rejected' ||
        kycDoc.documents.citizenshipBack.status === 'rejected' ||
        kycDoc.documents.profilePicture.status === 'rejected';
  
      // If any document is rejected, get the rejection comments
      let rejectedDocuments = [];
      if (hasRejectedDocuments) {
        if (kycDoc.documents.citizenshipFront.status === 'rejected') {
          rejectedDocuments.push({
            document: 'Citizenship Front',
            comment: kycDoc.documents.citizenshipFront.comments
          });
        }
        if (kycDoc.documents.citizenshipBack.status === 'rejected') {
          rejectedDocuments.push({
            document: 'Citizenship Back',
            comment: kycDoc.documents.citizenshipBack.comments
          });
        }
        if (kycDoc.documents.profilePicture.status === 'rejected') {
          rejectedDocuments.push({
            document: 'Profile Picture',
            comment: kycDoc.documents.profilePicture.comments
          });
        }
      }
  
      return res.status(200).json({
        hasRejectedDocuments,
        rejectedDocuments: hasRejectedDocuments ? rejectedDocuments : []
      });
  
    } catch (error) {
      console.error("Error checking KYC rejection status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
module.exports = { getOwnerProfile, updateOwner, changePassword, getOwnerStats, checkKycRejection };