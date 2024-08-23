const User = require('./../models/userModel');
const Startup = require('./../models/startupSchema');
const VC = require('./../models/vcSchema');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const filterObject = require('../utils/filterObject');

// To get All User: admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

// Updating User
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  const filteredBody = filterObject(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Deleting the User
exports.deleteMe = catchAsync(async (req, res, next) => {
  const { id, role } = req.user;
  await User.findByIdAndDelete(id);
  if (role === 'startup') {
    await Startup.findOneAndDelete({ user: id });
  }
  if (role === 'vc') {
    await Startup.findOneAndDelete({ user: id });
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
