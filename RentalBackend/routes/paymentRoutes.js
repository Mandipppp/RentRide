const express = require("express");
const { initiatePayment, verifyPayment, showReciept, initiateRefund, verifyRefund } = require("../controllers/paymentController");
const { authenticate, checkOwner } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post("/initiate", authenticate, initiatePayment);
router.post("/initiaterefund", authenticate, checkOwner, initiateRefund);

router.post("/verify", authenticate, verifyPayment);
router.post("/verifyrefund", authenticate, checkOwner, verifyRefund);

router.get("/receipt", showReciept);

module.exports = router;
