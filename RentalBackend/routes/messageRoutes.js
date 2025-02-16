const express = require('express');
const { startChat, sendMessage, loadChats } = require('../controllers/messagingController');

const router = express.Router();

router.post('/startchat', startChat);
router.post('/messages', sendMessage);
router.get('/:bookingId/messages', loadChats);

module.exports = router;