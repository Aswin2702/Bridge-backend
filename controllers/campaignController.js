const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Startup = require('../models/startupSchema');
const filterObject = require('../utils/filterObject');

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
        'You have already Capaign in process. Please Delete it to create new one.',
        400
      )
    );
  }
  const { title, description, targetAmount, rasidedAmount } = req.body;
  const newCampaign = {
    title,
    description,
    targetAmount,
    rasidedAmount
  };
  await startup.updateOne({
    $push: { campaigns: { $each: [newCampaign], $position: 0 } }
  });

  res.status(200).json({
    status: 'success',
    message: 'Campaign Creation Sucessfull.'
  });
});

// Update Campaign
exports.updateCampaign = catchAsync(async (req, res, next) => {
  const updateData = req.body;
  const filteredBody = filterObject(
    updateData,
    'title',
    'description',
    'targetAmount'
  );
  if (!filteredBody) {
    next(new AppError('Please enter valid detials for update.', 400));
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
    message: 'Campaign Updated Sucessfull.'
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
    message: 'Campaign Closed Sucessfull.',
    data: null
  });
});
