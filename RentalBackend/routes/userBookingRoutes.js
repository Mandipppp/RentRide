const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { createBooking, getUserBooking, getAllBookings, cancelUserBooking, getRenterBookings } = require('../controllers/userBookingController');
const router = express.Router();

router.post('/createBooking', authenticate, createBooking);
router.get('/getUsersBookings', authenticate, getAllBookings);
router.get('/getAllBookings', authenticate, getRenterBookings);

router.put('/cancel/:bookingId', authenticate, cancelUserBooking);
router.get('/:vehicleId', authenticate, getUserBooking);

module.exports = router;
