const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getOwnerBookings, getBookingById, acceptBooking, cancelBooking, startRental, endRental, downloadContract } = require('../controllers/ownerBookingController');
const router = express.Router();

router.get('/getOwnerBookings', authenticate, getOwnerBookings);
router.get('/getOwnerBooking/:bookingId', authenticate, getBookingById);
router.put('/acceptBooking', authenticate, acceptBooking);
router.put('/cancelBooking', authenticate, cancelBooking);
router.put('/startRental', authenticate, startRental);
router.put('/closeRental', authenticate, endRental);

router.get("/contract/:bookingId", downloadContract);



module.exports = router;
