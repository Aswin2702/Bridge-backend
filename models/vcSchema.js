const mongoose = require('mongoose');

const vcSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firmName: { type: String, required: true },
  investmentStage: { type: String, required: true },
  portfolioSize: { type: Number },
  preferredIndustries: [String],
  averageInvestmentSize: { type: Number, required: true },
  website: { type: String, required: true },
  location: { type: String, required: true }
});

const VC = mongoose.model('VC', vcSchema);

module.exports = VC;
