const express = require('express')
const { authenticate } = require('../middlewares/authMiddleware');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const router = express.Router();

// Route to get notifications for the authenticated user or owner
router.get('/view', authenticate, getNotifications);

// Route to mark a notification as read
router.put('/:notificationId/read', authenticate, markAsRead);

module.exports = router;