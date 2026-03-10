const express = require('express');
const { getUser, searchUsers } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/search', authenticateToken, searchUsers);
router.get('/:id', authenticateToken, getUser);

module.exports = router;
