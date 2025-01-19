const jwt = require('jsonwebtoken');

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
exports.checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access forbidden: Admins only' });
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


