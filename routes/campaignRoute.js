const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('./../controllers/authController');
const {
  createCampaign,
  closeCampaign,
  updateCampaign,
  getCampaign,
  getAllCampaign
} = require('../controllers/campaignController');

router.get('/get/:campaignId', protect, getCampaign);
router.get('/get-all', protect, getAllCampaign);
router.post('/create', protect, restrictTo('startup'), createCampaign);
router.patch('/update', protect, restrictTo('startup'), updateCampaign);
router.delete('/close', protect, restrictTo('startup'), closeCampaign);

module.exports = router;
