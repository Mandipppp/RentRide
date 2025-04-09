const multer = require('multer');
const path = require('path');

// Set storage engine
const storageOwner = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/owners/'); // upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Ensure unique file names
  },
});

// Set storage engine
const storageVehicle = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/vehicles/'); // upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Ensure unique file names
  },
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'));
  }
};

// Initialize upload middleware
const uploadOwner = multer({
  storageOwner,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter,
});

// Initialize upload middleware
const uploadVehicle = multer({
  storageVehicle,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter,
});


module.exports = {uploadOwner, uploadVehicle, storageOwner, storageVehicle};
