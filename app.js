const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('./models/userModel');
const userRouter = require('./routes/userRoute');
const startupRoute = require('./routes/startupRoute');
const campaignRoute = require('./routes/campaignRoute');
const authController = require('./controllers/authController');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Middleware function
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    },
    authController.googleAuth
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth callback route
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

app.use('/api/users', userRouter);
app.use('/api/startup', startupRoute);
app.use('/api/campaign', campaignRoute);
app.use(globalErrorHandler);

module.exports = app;
