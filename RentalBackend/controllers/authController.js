const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Owner = require('../models/owner');


exports.registerUser = async (req, res) => {
  const { name, contactNumber, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role, contactNumber });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// exports.registerOwner = async (req, res) => {
//     const {
//       name,
//       email,
//       password,
//       contactNumber,
//       profilePicture,
//       citizenshipFront,
//       citizenshipBack,
//       walletId
//     } = req.body;
  
//     try {
//       // Check if email already exists
//       const existingOwnerEmail = await Owner.findOne({ email });
//       const existingOwnerContact = await Owner.findOne({ contactNumber });

//       if (existingOwnerEmail) {
//         return res.status(400).json({ message: 'Email is already registered.' });
//       }

//       if (existingOwnerContact) {
//         return res.status(400).json({ message: 'Phone is already registered.' });
//       }
  
//       // Hash the password
//       const hashedPassword = await bcrypt.hash(password, 10);
  
//       // Create a new owner
//       const newOwner = new Owner({
//         name,
//         email,
//         password: hashedPassword,
//         contactNumber,
//         profilePicture,
//         citizenshipFront,
//         citizenshipBack,
//         walletId,
//       });
  
//       // Save the owner to the database
//       await newOwner.save();
  
//       res.status(201).json({
//         message: 'Owner registered successfully!',
//         owner: {
//           id: newOwner._id,
//           name: newOwner.name,
//           email: newOwner.email,
//           role: newOwner.role,
//           kycStatus: newOwner.kycStatus,
//         },
//       });
//     } catch (error) {
//       console.error('Error during owner signup:', error);
//       res.status(500).json({ message: 'Server error. Please try again later.' });
//     }
//   };
///////////////////////////
exports.registerOwner = async (req, res) => {
  const { name, email, password, contactNumber, walletId } = req.body;

  try {
    // Validate required files
    if (!req.files.profilePicture || !req.files.citizenshipFront || !req.files.citizenshipBack) {
      return res.status(400).json({ message: 'All document files are required.' });
    }
    
    // Check file size for profile picture
    if (req.files.profilePicture[0].size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ message: 'Upload image less than 5MB' });
    }

    // Check file size for citizenship front
    if (req.files.citizenshipFront[0].size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ message: 'Upload image less than 5MB' });
    }

    // Check file size for citizenship back
    if (req.files.citizenshipBack[0].size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ message: 'Upload image less than 5MB' });
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
      profilePicture,
      citizenshipFront,
      citizenshipBack,
      walletId,
    });

    // Save the owner to the database
    await newOwner.save();

    res.status(201).json({
      message: 'Owner registered successfully!',
      owner: {
        id: newOwner._id,
        name: newOwner.name,
        email: newOwner.email,
        role: newOwner.role,
        kycStatus: newOwner.kycStatus,
      },
    });
  } catch (error) {
    console.error('Error during owner signup:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
////////////////////




// exports.loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//       const user = await User.findOne({ email });
//       if (!user) return res.status(404).json({ message: 'User not found' });
  
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
//       const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name, contact: user.contactNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
//       res.status(200).json({ token, user: { name: user.name, email: user.email, role: user.role } });
//     } catch (error) {
//       res.status(500).json({ error: 'Server error' });
//     }
//   };

// exports.loginOwner = async (req, res) => {
// const { email, password } = req.body;
// try {
//     const owner = await Owner.findOne({ email });
//     if (!owner) return res.status(404).json({ message: 'User not found' });

//     const isMatch = await bcrypt.compare(password, owner.password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ id: owner._id, role: owner.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.status(200).json({ token, owner: { name: owner.name, email: owner.email, role: owner.role } });
// } catch (error) {
//     res.status(500).json({ error: 'Server error' });
// }
// };


exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Attempt to find the user by email in both User and Owner models
    let user = await User.findOne({ email });
    if (!user) {
      user = await Owner.findOne({ email });
    }

    if (!user) return res.status(404).json({ message: 'User or Owner not found' });

    // Compare the password for both User and Owner
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Create token based on whether it's a User or Owner
    let token;
    let responseData = {};

    if (user.role === 'owner') {
      // If it's an owner, create an owner-specific token and response
      token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      responseData = { token, owner: { name: user.name, email: user.email, role: user.role } };
    } else {
      // If it's a regular user, create a user-specific token and response
      token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name, contact: user.contactNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });
      responseData = { token, user: { name: user.name, email: user.email, role: user.role } };
    }

    // Send the response
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getUserDetails = async (req, res) => {
  try {
    // Step 1: Access the user data from req.user (populated by checkAuthentication)
    const user = req.user;
    // console.log("User in console",user)
    // Check if user data exists and if the userId is available
    if (!user || !user.id) {
      return res.status(404).json({ message: "User not found in request data." });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found in database." });
    }

    // Step 3: Return the user details in the response
    res.status(200).json({ data: user });

  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
