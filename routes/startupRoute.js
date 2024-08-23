const express = require('express');
const {
  addStartupDetails,
  updateStartupDetails,
  getViewCount,
  responseRequest
} = require('../controllers/startupController');
const { protect } = require('../controllers/authController');

const router = express.Router();
router.post('/add-details', protect, addStartupDetails);
router.patch('/update-details', protect, updateStartupDetails);
router.get('/viewed-investor', protect, getViewCount);
router.get('/investor-request', protect, responseRequest);

module.exports = router;
