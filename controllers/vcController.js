const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const VC = require('../models/vcSchema');
const Startup = require('../models/startupSchema');

// Get Details
exports.getVcDetails = catchAsync(async (req, res, next) => {
  let { id } = req.user;
  if (req.user.role === 'startup') {
    id = req.params.investorId;
  }
  const vc = await VC.findOne({ user: id });

  if (!vc) {
    return next(new AppError('No Details found match this id.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: vc
  });
});

// Add Details
exports.addVcDetails = catchAsync(async (req, res, next) => {
  const { id, role } = req.user;
  const {
    firmName,
    investmentStage,
    portfolioSize,
    preferredIndustries,
    averageInvestmentSize,
    website,
    location
  } = req.body;

  if (
    !firmName ||
    !investmentStage ||
    !averageInvestmentSize ||
    !website ||
    !location
  ) {
    return next(new AppError('Please provide all required fields', 400));
  }

  const existingDetails = await VC.findOne({ user: id });

  if (existingDetails) {
    return next(new AppError('VC details already exist for this user', 400));
  }

  await VC.create({
    user: id,
    firmName,
    investmentStage,
    portfolioSize,
    preferredIndustries,
    averageInvestmentSize,
    website,
    location
  });

  res.status(201).json({
    status: 'success',
    message: 'VC details added successfully'
  });
});

// Update Details
exports.updateVcDetails = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const vcDetails = req.body;
  if (!vcDetails) {
    return next(new AppError('Please enter valid details for update.', 400));
  }

  const updateCompanyDetails = await VC.findOneAndUpdate(
    { user: id },
    vcDetails
  );

  res.status(200).json({
    status: 'success',
    message: 'VC Updated Successfully.'
  });
});

exports.getAllCampaigns = catchAsync(async (req, res, next) => {
  const startup = await Startup.find({});
  console.log(startup.length());
});
