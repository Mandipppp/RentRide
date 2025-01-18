const express = require('express');
const { registerUser, registerOwner, getUserDetails, login } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// **********
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/registerUser', registerUser);

//changed
// router.post('/registerOwner', registerOwner);

// Use upload.fields for multiple files
router.post(
    '/registerOwner',
    upload.fields([
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
