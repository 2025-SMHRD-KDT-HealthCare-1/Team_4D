const express = require('express');
const {
  login,
  signup,
  findId,
  findPassword,
  withdrawMe,
} = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/find-id', findId);
router.post('/find-password', findPassword);
router.delete('/me', requireAuth, withdrawMe);

module.exports = router;
