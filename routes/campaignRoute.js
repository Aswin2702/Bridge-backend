const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('./../controllers/authController');
const {
  createCampaign,
  closeCampaign,
  updateCampaign
} = require('../controllers/campaignController');

router.post('/create', protect, restrictTo('startup'), createCampaign);
router.patch('/update', protect, restrictTo('startup'), updateCampaign);
router.delete('/close', protect, restrictTo('startup'), closeCampaign);

module.exports = router;
