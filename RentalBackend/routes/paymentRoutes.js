const express = require("express");
const { initiatePayment, verifyPayment, showReciept } = require("../controllers/paymentController");
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post("/initiate", authenticate, initiatePayment);
router.post("/verify", authenticate, verifyPayment);
router.get("/receipt", showReciept);

module.exports = router;
