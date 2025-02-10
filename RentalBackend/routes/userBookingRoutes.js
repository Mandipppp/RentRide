const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { createBooking } = require('../controllers/userBookingController');
const router = express.Router();

router.post('/createBooking', authenticate, createBooking);

module.exports = router;
