const crypto = require('crypto');
const { promisify } = require('util');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { sendEmail, generateVerificationToken } = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Creating a token
const createSendToken = (user, statusCode, res, message = 'Login Sucess') => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    role: user.role,
    message
  });
};

// Get user id form jwt
// exports.getUserId = catchAsync(async (req, res, next) => {
//   const token = req.header('Authorization').replace('Bearer ', '');
//   if (!token) {
//     new AppError('User not found.', 401);
//   }
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   req.userId = decoded.id;
//   next();
// });

exports.verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const { email } = decoded;
  let user = await User.findOneAndUpdate({ email }, { emailVerified: true });
  if (!user) {
    next(new AppError('User Not Found.', 404));
  }
  const message = 'Email Verification Successfull.';
  createSendToken(user, 200, res, message);
});

// Signup
exports.signup = catchAsync(async (req, res, next) => {
  const { email, password, role, name } = req.body;

  const token = generateVerificationToken(email);

  const verificationUrl = `http://localhost:3000/api/users/verify-email?token=${token}`;
  const subject = 'Verify Your Email';
  const html = `<p>Please verify your email by clicking the link below:</p><a href="${verificationUrl}">Verify Email</a>`;
  await sendEmail({
    email,
    subject,
    html
  });

  const newUser = await User.create({
    name,
    email,
    role,
    password
  });

  res.status(200).json({ message: 'Verification email sent.' });
});

// Signin
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

// Google Auth
exports.googleAuth = async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, displayName, emails } = profile;

    let user = await User.findOne({ googleId: id });

    if (!user) {
      user = await User.create({
        googleId: id,
        name: displayName,
        email: emails[0].value,
        password: id,
        role: 'startup'
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
};

// Google Callback
exports.googleCallback = catchAsync(async (req, res, next) => {
  console.log('app');
  createSendToken(req.user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (role) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    // roles ['admin', 'lead-guide']. role='user'
    if (role !== user.role) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/users/resetPassword/${resetToken}`;

  const html = `<p>You requested a password reset. Click the link below to reset your password:</p><a href="${resetUrl}">Reset Password</a><p>This link will expire in 10 minutes.</p>`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent successfully'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
