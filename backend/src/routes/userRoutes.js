const express = require('express');
const { getUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', authenticateToken, getUser);

module.exports = router;
