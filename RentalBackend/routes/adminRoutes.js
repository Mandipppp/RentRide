const express = require('express');
const router = express.Router();
const { getAllOwners, getOwnerById, updateKyc} = require('../controllers/adminOwnerController');
const { authenticate, checkAdmin } = require('../middlewares/authMiddleware');
const { getAllUsers, getUserById } = require('../controllers/adminUserController');
const { addAdmin, setupPassword } = require('../controllers/adminAdminController');
const { getAllVehicles, getVehicleById, verifyVehicle } = require('../controllers/adminVehicleController');
// Route to get all owners
router.get('/getOwners',authenticate, checkAdmin, getAllOwners);

router.get('/getUsers',authenticate, checkAdmin, getAllUsers);

router.get('/getVehicles', authenticate, checkAdmin, getAllVehicles);


// Route to get a specific owner by ID
router.get('/owner/:id', authenticate, checkAdmin, getOwnerById);
router.get('/renter/:id', authenticate, checkAdmin, getUserById);

router.post('/add-admin', authenticate, checkAdmin, addAdmin);
router.post('/setup-password/:token', setupPassword);

router.post('/kyc/:ownerId',authenticate, checkAdmin, updateKyc);

router.put('/verify-vehicle/:vehicleId', authenticate, checkAdmin, verifyVehicle);

//vehicles
router.get('/vehicle/:vehicleId', authenticate, checkAdmin, getVehicleById);



module.exports = router;

