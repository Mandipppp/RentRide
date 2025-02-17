const express = require('express');
const { startChat, sendMessage, loadChats, markMessagesAsSeen } = require('../controllers/messagingController');

const router = express.Router();

router.post('/startchat', startChat);
router.post('/messages', sendMessage);
router.get('/:bookingId/messages', loadChats);
router.put('/mark-seen', markMessagesAsSeen);


module.exports = router;