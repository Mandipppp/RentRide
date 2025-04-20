const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerProfile, updateOwner, changePassword, getOwnerStats, checkKycRejection } = require('../controllers/ownerSelfController');
const { getOwnerVehicles, updateVehicle, addVehicle, deleteVehicle, disableVehicle, enableVehicle } = require('../controllers/ownerVehicleController');
const { getVehicleById } = require('../controllers/adminVehicleController');
const uploadOwner = require('../middlewares/uploadMiddleware');
const multer = require('multer');
const { getOwnerReviews, getAllOwnerReviews } = require('../controllers/userReviewController');
const router = express.Router();

router.get("/me", authenticate, getOwnerProfile);
router.get("/getmystats", authenticate, getOwnerStats);
router.get("/getkycinfo", authenticate, checkKycRejection);
router.get("/myreviews", authenticate, getAllOwnerReviews);
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
router.get('/vehicle/:vehicleId/reviews', getOwnerReviews);
router.get('/vehicle/:vehicleId', authenticate, getVehicleById);

router.put(
  '/updateVehicle/:vehicleId', 
  authenticate,
  multer({ storage: uploadOwner.storageVehicle }).fields([
  { name: 'registrationCert', maxCount: 1 },
  { name: 'insuranceCert', maxCount: 1 },
  { name: 'pictures', maxCount: 5 },
  ]), 
  updateVehicle
);


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
// Route to disable a vehicle
router.patch('/vehicle/:vehicleId/disable', authenticate, disableVehicle);
// Route to enable a vehicle
router.patch('/vehicle/:vehicleId/enable', authenticate, enableVehicle);


module.exports = router;