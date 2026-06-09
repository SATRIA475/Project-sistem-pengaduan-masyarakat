const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getRooms } = require('../controllers/chatController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/messages', verifyToken, getMessages);
router.post('/messages', verifyToken, sendMessage);
router.get('/rooms', verifyToken, verifyAdmin, getRooms);

module.exports = router;
