const express = require('express');
const {
  addStartupDetails,
  updateStartupDetails,
  getViewCount,
  responseRequest,
  getStartupDetails
} = require('../controllers/startupController');
const { protect } = require('../controllers/authController');
const { getVcDetails } = require('../controllers/vcController');

const router = express.Router();
router.get('/get-details', protect, getStartupDetails);
router.post('/add-details', protect, addStartupDetails);
router.patch('/update-details', protect, updateStartupDetails);

router.get('/get-investor/:investorId', protect, getVcDetails);
router.get('/viewed-investor', protect, getViewCount);
router.get('/investor-request', protect, responseRequest);

module.exports = router;
