const mongoose = require('mongoose');

const vcSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firmName: { type: String, required: true },
  investmentStage: { type: String },
  portfolioSize: { type: Number },
  preferredIndustries: [String],
  averageInvestmentSize: { type: Number },
  website: { type: String },
  location: { type: String }
});

const VC = mongoose.model('VC', vcSchema);

module.exports = VC;
