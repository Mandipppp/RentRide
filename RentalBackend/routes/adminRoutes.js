const express = require('express');
const router = express.Router();
const { getAllOwners, getOwnerById, updateKyc} = require('../controllers/adminOwnerController');
const { authenticate, checkAdmin } = require('../middlewares/authMiddleware');
const { getAllUsers, getUserById } = require('../controllers/adminUserController');
const { addAdmin, setupPassword } = require('../controllers/adminAdminController');
// Route to get all owners
router.get('/getOwners',authenticate, checkAdmin, getAllOwners);

router.get('/getUsers',authenticate, checkAdmin, getAllUsers);

// Route to get a specific owner by ID
router.get('/:id', authenticate, checkAdmin, getOwnerById);
router.get('/renter/:id', authenticate, checkAdmin, getUserById);

router.post('/add-admin', authenticate, checkAdmin, addAdmin);
router.post('/setup-password/:token', setupPassword);

router.post('/kyc/:ownerId',authenticate, checkAdmin, updateKyc);


module.exports = router;

