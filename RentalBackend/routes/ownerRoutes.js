const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerProfile, updateOwner, changePassword } = require('../controllers/ownerSelfController');
const { getOwnerVehicles, updateVehicleByOwner, addVehicle, deleteVehicle } = require('../controllers/ownerVehicleController');
const { getVehicleById } = require('../controllers/adminVehicleController');
const uploadOwner = require('../middlewares/uploadMiddleware');
const multer = require('multer');
const router = express.Router();

router.get("/me", authenticate, getOwnerProfile);
router.put(
    '/me',
    authenticate,
    multer({ storage: uploadOwner.storageOwner }).fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'citizenshipFront', maxCount: 1 },
        { name: 'citizenshipBack', maxCount: 1 },
      ]),
    updateOwner
  );
router.put('/change-password', authenticate, changePassword);

router.get('/myvehicles', authenticate, getOwnerVehicles);
router.get('/vehicle/:vehicleId', authenticate, getVehicleById);
router.post('/updateVehicle/:vehicleId', authenticate, updateVehicleByOwner);
router.post(
  '/addVehicle',
  authenticate,
  multer({ storage: uploadOwner.storageVehicle }).fields([
    { name: 'registrationCert', maxCount: 1 },
    { name: 'insuranceCert', maxCount: 1 },
    { name: 'pictures', maxCount: 5 },
  ]),
  addVehicle
);
router.delete('/vehicle/:vehicleId', authenticate, deleteVehicle);


module.exports = router;