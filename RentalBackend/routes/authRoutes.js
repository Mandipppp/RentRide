const express = require('express');
const { registerUser, registerOwner, getUserDetails, login, registerEmail, verifyEmail } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// **********
const uploadOwner = require('../middlewares/uploadMiddleware');
const multer = require('multer');

const router = express.Router();

// Route for submitting email to receive verification link
router.post('/registerEmail', registerEmail);

// Route for verifying the email
router.get('/verify-email/:token', verifyEmail);

// Route for completing the registration after email is verified
router.post('/registerUser', registerUser);

//changed
// router.post('/registerOwner', registerOwner);

// Use upload.fields for multiple files
router.post(
  '/registerOwner',
  multer({ storage: uploadOwner.storageOwner }).fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
  ]),
  registerOwner
);


//////////////

router.post('/login', login);
// router.post('/loginOwner', loginOwner);
router.get('/getUserInfo', authenticate, getUserDetails);



module.exports = router;
