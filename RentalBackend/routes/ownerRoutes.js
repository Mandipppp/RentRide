const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerProfile, updateOwner, changePassword } = require('../controllers/ownerSelfController');
const upload = require('../middlewares/uploadMiddleware');
const router = express.Router();

router.get("/me", authenticate, getOwnerProfile);
router.put(
    '/me',
    authenticate,
    upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'citizenshipFront', maxCount: 1 },
      { name: 'citizenshipBack', maxCount: 1 },
    ]),
    updateOwner
  );
router.put('/change-password', authenticate, changePassword);

module.exports = router;