const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  // console.log("token: ",token);

  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // console.log(decoded);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

exports.authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access forbidden' });
  next();
};

// Check if the user is an admin
exports.checkAdmin = async(req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access forbidden: Admins only' });
  }
  // Fetch complete user data to check block status
  const adminUser = await User.findById(req.user.id);
  if (!adminUser) {
    return res.status(404).json({ 
      success: false,
      message: 'Admin account not found' 
    });
  }

  // Check block status
  if (adminUser.blockStatus !== 'active') {
    const message = adminUser.blockStatus === 'pending_block' 
      ? 'Your account is pending block review' 
      : 'Your account has been blocked';
    
    return res.status(403).json({
      success: false,
      message: `Access forbidden: ${message}`,
      blockReason: adminUser.blockReason || 'No reason provided',
      blockedAt: adminUser.blockedAt
    });
  }
  next();
};

// Check if the user is a superadmin
exports.checkSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access forbidden: Super Admins only' });
  }
  next();
};

// Check if the user is a renter
exports.checkRenter = (req, res, next) => {
  if (req.user.role !== 'renter') {
    return res.status(403).json({ message: 'Access forbidden: Renter only' });
  }
  next();
};

// Check if the user is a owner
exports.checkOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access forbidden: Owner only' });
  }
  next();
};


