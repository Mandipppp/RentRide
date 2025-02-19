const express = require('express');
const { postReview, getReviews } = require('../controllers/userReviewController');
const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();


// Route for posting a review
router.post('/post-review', authenticate, postReview);
router.get('/vehicle/:vehicleId', authenticate, getReviews);

module.exports = router;
