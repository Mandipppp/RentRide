const express = require("express");
const { requestPasswordReset, resetPassword } = require("../controllers/forgotPass");

const router = express.Router();

// Route for requesting a password reset
router.post("/forgot-password", requestPasswordReset);

// Route for resetting the password
router.post("/reset-password", resetPassword);

module.exports = router;
