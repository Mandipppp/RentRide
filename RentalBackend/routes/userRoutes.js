const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getProfile, updateUser, changePassword } = require('../controllers/userSelfController');
const { submitContactForm } = require('../controllers/userContactController');
const { getAvailableVehicles, getVehicleById } = require('../controllers/userVehicleController');
const router = express.Router();

router.get("/me", authenticate, getProfile);
router.put('/me', authenticate, updateUser);
router.put('/change-password', authenticate, changePassword);

router.post("/contact-query", authenticate, submitContactForm);


router.get("/vehicles", authenticate, getAvailableVehicles);
router.get("/vehicles/:vehicleId", authenticate, getVehicleById);

module.exports = router;