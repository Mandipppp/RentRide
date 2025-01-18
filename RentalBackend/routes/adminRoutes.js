const express = require('express');
const router = express.Router();
const { getAllOwners, getOwnerById} = require('../controllers/adminOwnerController');
const { authenticate, checkAdmin } = require('../middlewares/authMiddleware');
const { getAllUsers, getUserById } = require('../controllers/adminUserController');

// Route to get all owners
router.get('/getOwners',authenticate, checkAdmin, getAllOwners);

router.get('/getUsers',authenticate, checkAdmin, getAllUsers);

// Route to get a specific owner by ID
router.get('/:id', authenticate, checkAdmin, getOwnerById);
router.get('/renter/:id', authenticate, checkAdmin, getUserById);


module.exports = router;

