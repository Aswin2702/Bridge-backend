const express = require('express');

const { protect } = require('../controllers/authController');
const {
  addVcDetails,
  updateVcDetails,
  getAllCampaigns
} = require('../controllers/vcController');

const router = express.Router();
router.post('/add-details', protect, addVcDetails);
router.patch('/update-details', protect, updateVcDetails);
router.get('/get-campaigns', protect, getAllCampaigns);

module.exports = router;
