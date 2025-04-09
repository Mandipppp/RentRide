const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Owner = require('../models/owner');
const KYC = require('../models/kyc');

const nodemailer = require("nodemailer");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Generate a random token for email verification
const generateVerificationToken = (email, type) => {
  return jwt.sign({ email, type }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Function to send verification email
const sendVerificationEmail = (email, token, type) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Determine the verification link and email subject based on the type
  const verificationLink = type === 'owner'
    ? `http://localhost:5173/complete-owner-registration/${token}`
    : `http://localhost:5173/complete-renter-registration/${token}`;
  
  const emailSubject = type === 'owner'
    ? 'Owner Email Verification'
    : 'User Email Verification';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: emailSubject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://your-logo-url.com/logo.png" alt="RentRide Logo" style="max-width: 200px;">
        </div>
        <h2 style="text-align: center; color: #4CAF50;">Welcome to RentRide!</h2>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          We're excited to have you on board. Please verify your email to complete the registration process.
        </p>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          <strong style="font-size: 18px;">Click the link below to verify your email:</strong>
        </p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: #fff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;">
            Verify Your Email
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.5; text-align: center; margin-top: 30px; color: #555;">
          If you did not sign up for RentRide, please ignore this email. Your email will not be used for any other purpose.
        </p>
        <p style="font-size: 14px; text-align: center; color: #777;">
          <strong>RentRide</strong> - Your trusted vehicle rental service.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};


exports.registerEmail = async (req, res) => {
  const { email, type } = req.body;

  try {
    // Determine the model based on the type
    const Model = type === 'owner' ? Owner : User;
    if (validateEmail(email) === false) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check if the email already exists in their models
    const existingUser = await Model.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    // Generate a verification token
    const token = generateVerificationToken(email, type);

    // Send verification email
    await sendVerificationEmail(email, token, type);

    res.status(200).json({ message: 'Verification email sent!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token has expired' };
    }
    return { valid: false, error: 'Invalid token' };
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, type } = decoded;

    // Determine the appropriate model based on the type
    const Model = type === 'owner' ? Owner : User;

    // Check if the email already exists in the respective collection
    const existingEntity = await Model.findOne({ email });
    if (existingEntity) {
      return res.status(400).json({ message: `${type} email is already registered` });
    }

    // If email is not found in the database, verification is successful
    res.status(200).json({ email, message: `${type} email verified, please proceed with registration.` });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

exports.registerUser = async (req, res) => {
  const { name, contactNumber, email, password, role, token } = req.body;

  try {
    // Verify token first
    const tokenValidation = verifyToken(token);
    if (!tokenValidation.valid) {
      return res.status(401).json({ 
        error: 'Your session has expired. Please restart the registration process.',
        tokenExpired: true
      });
    }

    // Verify email matches the one in token
    if (tokenValidation.decoded.email !== email) {
      return res.status(401).json({ 
        error: 'Email mismatch. Please use the same email used for verification.' 
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Validate name
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ 
        error: 'Name must be between 2 and 50 characters' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: 'Please enter a valid email address' 
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      contactNumber,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.registerOwner = async (req, res) => {
  const { name, email, password, contactNumber, walletId, token } = req.body;

  try {
    const tokenValidation = verifyToken(token);
    if (!tokenValidation.valid) {
      return res.status(401).json({ 
        error: 'Your session has expired. Please restart the registration process.',
        tokenExpired: true
      });
    }

    // Verify email matches the one in token
    if (tokenValidation.decoded.email !== email) {
      return res.status(401).json({ 
        error: 'Email mismatch. Please use the same email used for verification.' 
      });
    }
    
    if (!name || !email || !password || !contactNumber || !walletId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Name validation
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: 'Name must be between 2 and 50 characters.' });
    }
    if (!/^[a-zA-Z\s]*$/.test(name)) {
      return res.status(400).json({ message: 'Name can only contain letters and spaces.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Contact number validation
    if (!validatePhone(contactNumber)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    // Wallet ID validation
    if (!validatePhone(walletId)) {
      return res.status(400).json({ message: 'Wallet ID must be exactly 10 digits.' });
    }

    // Password validation
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character.' 
      });
    }

    // Validate required files
    if (!req.files.profilePicture || !req.files.citizenshipFront || !req.files.citizenshipBack) {
      return res.status(400).json({ message: 'All document files are required.' });
    }
    
    // // Check file size for profile picture
    // if (req.files.profilePicture[0].size > 5 * 1024 * 1024) { // 5MB limit
    //   return res.status(400).json({ message: 'Upload image less than 5MB' });
    // }

    // // Check file size for citizenship front
    // if (req.files.citizenshipFront[0].size > 5 * 1024 * 1024) { // 5MB limit
    //   return res.status(400).json({ message: 'Upload image less than 5MB' });
    // }

    // // Check file size for citizenship back
    // if (req.files.citizenshipBack[0].size > 5 * 1024 * 1024) { // 5MB limit
    //   return res.status(400).json({ message: 'Upload image less than 5MB' });
    // }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const files = [
      { name: 'Profile Picture', file: req.files.profilePicture[0] },
      { name: 'Citizenship Front', file: req.files.citizenshipFront[0] },
      { name: 'Citizenship Back', file: req.files.citizenshipBack[0] }
    ];

    for (const file of files) {
      if (!allowedTypes.includes(file.file.mimetype)) {
        return res.status(400).json({ 
          message: `${file.name} must be a JPG, JPEG, or PNG file.` 
        });
      }
      if (file.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ 
          message: `${file.name} must be less than 5MB.` 
        });
      }
    }

    const profilePicture = req.files.profilePicture[0].path;
    const citizenshipFront = req.files.citizenshipFront[0].path;
    const citizenshipBack = req.files.citizenshipBack[0].path;

    // Check if email or phone already exists
    const existingOwnerEmail = await Owner.findOne({ email });
    const existingOwnerContact = await Owner.findOne({ contactNumber });

    if (existingOwnerEmail) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    if (existingOwnerContact) {
      return res.status(400).json({ message: 'Phone is already registered.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new owner
    const newOwner = new Owner({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      walletId,
    });

    // Save the owner to the database
    await newOwner.save();

    // Create the KYC document
    const newKYC = new KYC({
      ownerId: newOwner._id,
      documents: {
        profilePicture: {
          file: profilePicture,
          status: 'pending',
        },
        citizenshipFront: {
          file: citizenshipFront,
          status: 'pending',
        },
        citizenshipBack: {
          file: citizenshipBack,
          status: 'pending',
        },
      },
    });

    // Save the KYC record to the database
    await newKYC.save();

    // Link the KYC to the owner by updating the owner's kycId field
    newOwner.kycId = newKYC._id;
    await newOwner.save();

    res.status(201).json({
      message: 'Owner registered successfully!',
      owner: {
        id: newOwner._id,
        name: newOwner.name,
        email: newOwner.email,
        role: newOwner.role,
        kycStatus: 'pending', // Initially, the KYC status is pending
      },
    });
  } catch (error) {
    console.error('Error during owner signup:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    // Attempt to find the user by email in both User and Owner models
    let user;

    if (role === "renter") {
      user = await User.findOne({ email, role }); // Match renter role
    } else if (role === "admin") {
      // Check for both admin and superadmin roles when admin is selected
      user = await User.findOne({
        email,
        role: { $in: ['admin', 'superadmin'] }
      });
    } else if (role === "owner") {
      user = await Owner.findOne({ email, role }); // Check in Owner collection
    }

    if (!user) return res.status(404).json({ message: "User with this role not found" });


    // Compare the password for both User and Owner
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Create token based on whether it's a User or Owner
    let token;
    let responseData = {};

    if (user.role === 'owner') {
      // If it's an owner, create an owner-specific token and response
      token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '5h' });
      responseData = { token, owner: { name: user.name, email: user.email, role: user.role, blockStatus: user.blockStatus } };
    } else {
      // If it's a regular user, create a user-specific token and response
      token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name, contact: user.contactNumber }, process.env.JWT_SECRET, { expiresIn: '5h' });
      responseData = { token, user: { name: user.name, email: user.email, role: user.role, blockStatus: user.blockStatus } };
    }

    // Send the response
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getUserDetails = async (req, res) => {
  try {
    // Access the user data from req.user (populated by checkAuthentication)
    const user = req.user;
    // console.log("User in console",user)
    // Check if user data exists and if the userId is available
    if (!user || !user.id) {
      return res.status(404).json({ message: "User not found in request data." });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found in database." });
    }

    // Return the user details in the response
    res.status(200).json({ data: user });

  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
