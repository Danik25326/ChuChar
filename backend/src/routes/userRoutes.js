const express = require('express');
const { getUser, searchUsers, updateAvatar } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../controllers/uploadController');

const router = express.Router();

router.get('/search', authenticateToken, searchUsers);
router.get('/:id', authenticateToken, getUser);
router.post('/avatar', authenticateToken, upload.single('avatar'), updateAvatar);

module.exports = router;
