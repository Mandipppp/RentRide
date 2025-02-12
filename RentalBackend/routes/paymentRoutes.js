const express = require("express");
const { initiatePayment, verifyPayment } = require("../controllers/paymentController");

const router = express.Router();

router.post("/initiate", initiatePayment);
router.post("/verify", verifyPayment);

module.exports = router;
