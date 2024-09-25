const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Startup = require('../models/startupSchema');
const filterObject = require('../utils/filterObject');

// Get All Campaign
exports.getAllCampaign = catchAsync(async (req, res, next) => {
  const startups = await Startup.aggregate([
    { $unwind: '$campaigns' },
    { $match: { 'campaigns.active': true } },
    {
      $project: {
        _id: 0,
        campaign: '$campaigns',
        postedBy: '$companyName'
      }
    },
    { $sort: { 'campaign.createdAt': -1 } }
  ]);

  if (!startups || startups.length === 0) {
    return next(new AppError('No active campaigns found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: startups.map((startup) => ({
      ...startup.campaign,
      postedBy: startup.postedBy
    }))
  });
});

// Get Campaign
exports.getCampaign = catchAsync(async (req, res, next) => {
  const campaignId = req.params.campaignId;
  const startup = await Startup.findOne(
    { 'campaigns._id': campaignId },
    { 'campaigns.$': 1 }
  ).exec();

  if (!startup) {
    return next(new AppError('Startup not found', 400));
  }

  if (startup.campaigns.length <= 0) {
    return next(new AppError('Startup not found', 400));
  }

  res.status(200).json({
    status: 'success',
    data: startup.campaigns[0]
  });
});

// Create Campaign
exports.createCampaign = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const startup = await Startup.findOne({ user: id });

  if (!startup) {
    return next(new AppError('User not found', 404));
  }

  if (startup.campaigns[0] && startup.campaigns[0].active) {
    return next(
      new AppError(
        'You have already Campaign in process. Please Delete it to create new one.',
        400
      )
    );
  }
  const {
    title,
    description,
    round,
    size,
    raisedAmount,
    preferredSecurities,
    source,
    investorViewed,
    requests,
    active,
    closeAt
  } = req.body;

  if (
    !title ||
    !description ||
    !round ||
    !size ||
    !preferredSecurities ||
    !source ||
    !closeAt
  ) {
    return next(new AppError('Please provide the required fields.', 400));
  }
  const newCampaign = {
    user: startup._id,
    title,
    description,
    productType: startup.productType,
    round,
    size,
    raisedAmount,
    preferredSecurities,
    source,
    investorViewed,
    requests,
    active,
    closeAt
  };
  await startup.updateOne({
    $push: { campaigns: { $each: [newCampaign], $position: 0 } }
  });

  res.status(200).json({
    status: 'success',
    message: 'Campaign Creation Successful.'
  });
});

// Update Campaign
exports.updateCampaign = catchAsync(async (req, res, next) => {
  const updateData = req.body;
  const filteredBody = filterObject(
    updateData,
    'title',
    'description',
    'size',
    'preferredSecurities',
    'source',
    'closeAt'
  );
  if (!filteredBody) {
    return next(new AppError('Please enter valid details for update.', 400));
  }

  const startup = await Startup.findOne({ user: req.user.id });
  if (!startup) {
    return next(new AppError('User not found', 404));
  }

  if (!startup.campaigns[0].active) {
    return next(new AppError('You have no ongoing campaign.', 400));
  }

  await Startup.findOneAndUpdate(
    { user: req.user.id },
    {
      $set: {
        'campaigns.0.title': filteredBody.title,
        'campaigns.0.description': filteredBody.description,
        'campaigns.0.targetAmount': filteredBody.targetAmount
      }
    }
  );
  res.status(200).json({
    status: 'success',
    message: 'Campaign Updated Successful.'
  });
});

// Close Campaign
exports.closeCampaign = catchAsync(async (req, res, next) => {
  const { id } = req.user;

  const startup = await Startup.findOne({ user: id });
  if (!startup) {
    return next(new AppError('User not found', 404));
  }

  if (!startup.campaigns[0].active) {
    return next(new AppError('You have no ongoing campaign.', 400));
  }

  await startup.updateOne({
    $set: { 'campaigns.0.active': false }
  });

  res.status(200).json({
    status: 'success',
    message: 'Campaign Closed Successful.',
    data: null
  });
});
