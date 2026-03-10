const express = require('express');
const { createChat, getUserChats, getChatMessages, getChat, getChatMembers } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createChat);
router.get('/', authenticateToken, getUserChats);
router.get('/:chatId', authenticateToken, getChat);
router.get('/:chatId/messages', authenticateToken, getChatMessages);
router.get('/:chatId/members', authenticateToken, getChatMembers);

module.exports = router;
