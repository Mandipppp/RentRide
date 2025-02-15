const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerBookings, getBookingById, acceptBooking } = require('../controllers/ownerBookingController');
const router = express.Router();

router.get('/getOwnerBookings', authenticate, getOwnerBookings);
router.get('/getOwnerBooking/:bookingId', authenticate, getBookingById);
router.post('/acceptBooking', authenticate, acceptBooking);


module.exports = router;
