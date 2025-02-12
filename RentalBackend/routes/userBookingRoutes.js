const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { createBooking, getUserBooking, getAllBookings, cancelUserBooking, getRenterBookings, getBookingById, getAllVehicleBookings } = require('../controllers/userBookingController');
const router = express.Router();

router.post('/createBooking', authenticate, createBooking);
router.get('/getUsersBookings', authenticate, getAllBookings);
router.get('/getAllBookings', authenticate, getRenterBookings);

router.put('/cancel/:bookingId', authenticate, cancelUserBooking);
router.get('/getBooking/:bookingId', authenticate, getBookingById);

router.get("/getVehicleBookings/:vehicleId",authenticate, getAllVehicleBookings);

router.get('/:vehicleId', authenticate, getUserBooking);

module.exports = router;
