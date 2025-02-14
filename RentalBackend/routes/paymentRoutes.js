const express = require("express");
const { initiatePayment, verifyPayment } = require("../controllers/paymentController");
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post("/initiate", authenticate, initiatePayment);
router.post("/verify", authenticate, verifyPayment);

module.exports = router;
