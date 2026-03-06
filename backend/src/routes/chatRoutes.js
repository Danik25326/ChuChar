const express = require('express');
const { createChat, getUserChats, getChatMessages } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createChat);
router.get('/', authenticateToken, getUserChats);
router.get('/:chatId/messages', authenticateToken, getChatMessages);

module.exports = router;
