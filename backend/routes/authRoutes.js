const express = require('express');
const router = express.Router();
const { register, login, getUserProgress } = require('../controllers/AuthController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/progress/:courseId', protect, getUserProgress);

module.exports = router;
