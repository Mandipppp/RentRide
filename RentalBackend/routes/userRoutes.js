const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getProfile, updateUser, changePassword } = require('../controllers/userSelfController');
const { submitContactForm } = require('../controllers/userContactController');
const router = express.Router();

router.get("/me", authenticate, getProfile);
router.put('/me', authenticate, updateUser);
router.put('/change-password', authenticate, changePassword);

router.post("/contact-query", authenticate, submitContactForm);
module.exports = router;