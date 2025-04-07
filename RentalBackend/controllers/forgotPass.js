const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require('../models/user');
const Owner = require('../models/owner');
const bcrypt = require("bcrypt");


exports.requestPasswordReset = async (req, res) => {
  const { email, role } = req.body;
  // console.log("Requesting password reset for email:", email, "Role:", role);

  try {
    // Find user or owner by email
    if(!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if(!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    let user = null;
    let owner = null;

    if(role == 'renter') {
      user = await User.findOne({ email, role: 'renter' });
    }

    if(role == 'admin') {
      user = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } });
    }

    if(role == 'owner') {
      owner = await Owner.findOne({ email });
    }

    if (!user && !owner) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine if it's a user or an owner
    const model = user ? User : Owner;
    const entity = user || owner;

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Save token and expiry in the database
    entity.resetPasswordToken = resetToken;
    entity.resetPasswordExpiry = resetTokenExpiry;
    await entity.save();

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Use your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`; // Frontend URL
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://your-logo-url.com/logo.png" alt="RentRide Logo" style="max-width: 200px;">
        </div>
        <h2 style="text-align: center; color: #4CAF50;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          We received a request to reset the password for your RentRide account. If you did not request this, please ignore this email.
        </p>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          <strong style="font-size: 18px;">Click the link below to reset your password:</strong>
        </p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: #fff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;">
            Reset Your Password
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.5; text-align: center; margin-top: 30px; color: #555;">
          This link will expire in 1 hour for security purposes. If you did not request a password reset, please disregard this email.
        </p>
        <p style="font-size: 14px; text-align: center; color: #777;">
          <strong>RentRide</strong> - Your trusted vehicle rental service.
        </p>
      </div>
    `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
  
    try {
      // Find user by reset token and check if token is valid
      let user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() },
      });

      let owner = await Owner.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() },
      });
  
      if (!user && !owner) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Determine if it's a user or an owner
    const model = user ? User : Owner;
    const entity = user || owner;
  
        // Hash the new password using the same mechanism
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        entity.password = hashedPassword;
  
      // Clear reset token and expiry
      entity.resetPasswordToken = undefined;
      entity.resetPasswordExpiry = undefined;
  
      await entity.save();
  
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  };