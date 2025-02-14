const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerBookings } = require('../controllers/ownerBookingController');
const router = express.Router();

router.get('/getOwnerBookings', authenticate, getOwnerBookings);


module.exports = router;
