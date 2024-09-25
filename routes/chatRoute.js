const express = require('express');
const router = express.Router();
const {
  sendMessage,
  markAsSeen,
  historyMessages
} = require('../controllers/chatController');
const { protect } = require('../controllers/authController');

router.post('/sendMessage', protect, sendMessage);
router.patch('/markAsSeen', protect, markAsSeen);
router.get('/history', protect, historyMessages);

module.exports = router;
