const mongoose = require('mongoose');
const validator = require('validator');

const investorViewedSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

const requestSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  investorViewed: [investorViewedSchema],
  requests: [requestSchema],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  closeAt: {
    type: Date,
    default: Date.now() + 24 * 60 * 60 * 1000 * 1000
  }
});

const founderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  linkedinUrl: { type: String, required: true }
});

const startupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  description: { type: String, required: true },
  founder: { type: [founderSchema], required: true },
  website: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  businessType: { type: String, required: true },
  productType: { type: String, required: true },
  companyStage: { type: String, required: true },
  annualRevenue: { type: Number, required: true },
  monthlyRevenue: { type: Number, required: true },
  noOfEmployees: { type: Number, required: true },

  socialLinks: { type: Object },
  teamMembers: [Object],
  documents: [Object],
  qAndA: [Object],
  campaigns: [campaignSchema]
});

const Startup = mongoose.model('Startup', startupSchema);

module.exports = Startup;
