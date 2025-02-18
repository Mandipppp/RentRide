const express = require('express');
const { postReview } = require('../controllers/userReviewController');
const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();


// Route for posting a review
router.post('/post-review', authenticate, postReview);

module.exports = router;
