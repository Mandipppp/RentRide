const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerBookings, getBookingById, acceptBooking, cancelBooking } = require('../controllers/ownerBookingController');
const router = express.Router();

router.get('/getOwnerBookings', authenticate, getOwnerBookings);
router.get('/getOwnerBooking/:bookingId', authenticate, getBookingById);
router.put('/acceptBooking', authenticate, acceptBooking);
router.put('/cancelBooking', authenticate, cancelBooking);



module.exports = router;
