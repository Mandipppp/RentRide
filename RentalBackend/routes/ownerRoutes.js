const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerProfile, updateOwner, changePassword } = require('../controllers/ownerSelfController');
const { getOwnerVehicles, updateVehicleByOwner } = require('../controllers/ownerVehicleController');
const { getVehicleById } = require('../controllers/adminVehicleController');
const uploadOwner = require('../middlewares/uploadMiddleware');
const router = express.Router();

router.get("/me", authenticate, getOwnerProfile);
router.put(
    '/me',
    authenticate,
    uploadOwner.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'citizenshipFront', maxCount: 1 },
      { name: 'citizenshipBack', maxCount: 1 },
    ]),
    updateOwner
  );
router.put('/change-password', authenticate, changePassword);

router.put('/myvehicles', authenticate, getOwnerVehicles);
router.get('/vehicle/:vehicleId', authenticate, getVehicleById);
router.get('/updateVehicle/:vehicleId', authenticate, updateVehicleByOwner);



module.exports = router;