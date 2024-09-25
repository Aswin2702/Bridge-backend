const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const Startup = require('./../models/startupSchema');
const AppError = require('../utils/appError');
const VC = require('../models/vcSchema');

// Get Details
exports.getStartupDetails = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const startup = await Startup.findOne({ user: id });

  if (!startup) {
    return next(new AppError('No Details found match this id.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: startup
  });
});

// Add Startup Details
exports.addStartupDetails = catchAsync(async (req, res, next) => {
  const { id, role } = req.user;
  const {
    companyName,
    description,
    founder,
    website,
    country,
    city,
    businessType,
    productType,
    companyStage,
    annualRevenue,
    monthlyRevenue,
    noOfEmployees,
    socialLinks,
    teamMembers,
    documents,
    qAndA
  } = req.body;

  if (
    !companyName ||
    !description ||
    !founder ||
    !Array.isArray(founder) ||
    founder.length === 0 ||
    !website ||
    !country ||
    !city ||
    !businessType ||
    !productType ||
    !companyStage ||
    annualRevenue === undefined ||
    monthlyRevenue === undefined ||
    noOfEmployees === undefined
  ) {
    return next(new AppError('Please provide all required fields', 400));
  }

  const existingDetails = await Startup.findOne({ user: id });

  if (existingDetails) {
    return next(
      new AppError('Startup details already exist for this user', 400)
    );
  }

  await Startup.create({
    user: id,
    companyName,
    description,
    founder,
    website,
    country,
    city,
    businessType,
    productType,
    companyStage,
    annualRevenue,
    monthlyRevenue,
    noOfEmployees,
    socialLinks,
    teamMembers,
    documents,
    qAndA
  });

  res.status(201).json({
    status: 'success',
    message: 'Startup details added successfully'
  });
});

// Update Startup Details
exports.updateStartupDetails = catchAsync(async (req, res, next) => {
  const { id, role } = req.user;
  const startupDetails = req.body;
  if (!startupDetails) {
    return next(new AppError('Please enter valid details for update.', 400));
  }

  const updateCompanyDetails = await Startup.findOneAndUpdate(
    { user: id },
    startupDetails
  );

  res.status(200).json({
    status: 'success',
    message: `Your ${role} Updated Successfully.`
  });
});

// Get View Count
exports.getViewCount = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  let { startDate, endDate } = req.body;
  const startup = await Startup.findOne({ user: id });

  if (!startup) {
    return next(new AppError('Startup not found', 400));
  }

  startDate = new Date(startDate);
  endDate = new Date(endDate);
  console.log(startDate, endDate);

  if (!startDate || !endDate) {
    return next(new AppError('Please provide the duration'));
  }

  const investorSet = new Set();

  for (const campaign of startup.campaigns) {
    for (const view of campaign.investorViewed) {
      if (view.viewedAt >= startDate && view.viewedAt <= endDate) {
        const investor = await VC.findById(view.investorId);
        investorSet.add(investor);
      }
    }
  }

  res.status(200).json({
    status: 'success',
    data: [...investorSet]
  });
});

// Respond Request
exports.responseRequest = catchAsync(async (req, res, next) => {
  const startupId = req.user.id;
  const { campaignId, requestId, response } = req.body;
  const startup = await Startup.findById(startupId);

  if (!startup) {
    return next(new AppError('Startup not found'));
  }

  const campaign = startup.campaigns.id(campaignId);

  if (!campaign) {
    return next(new AppError('Campaign not found'));
  }

  const request = campaign.requests.id(requestId);

  if (!request) {
    return next(new AppError('Request not found'));
  }

  request.status = response;
  request.updatedAt = new Date();

  await startup.save();

  res.status(200).json({
    status: 'success',
    message: `Request ${response} successfully`
  });
});

// Temp
const addInvestorView = async (startupId, campaignId, investorId) => {
  try {
    // Find the startup and the specific campaign within it
    const startup = await Startup.findOne({
      _id: new mongoose.Types.ObjectId(startupId),
      'campaigns._id': new mongoose.Types.ObjectId(campaignId)
    });

    if (!startup) {
      throw new Error('Startup or Campaign not found');
    }

    // Find the specific campaign in the startup
    const campaign = startup.campaigns.id(campaignId);

    // Add the investor view to the investorViewed array
    campaign.investorViewed.push({
      investorId: new mongoose.Types.ObjectId(investorId),
      viewedAt: new Date() // Set the viewedAt timestamp to now
    });

    // Save the updated startup document
    await startup.save();

    console.log('Investor view added successfully');
  } catch (error) {
    console.error('Error adding investor view:', error.message);
  }
};
