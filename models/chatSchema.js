const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false } // Tracks if the message has been seen
});

const chatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  ],
  messages: [messageSchema],
  lastUpdated: { type: Date, default: Date.now },
  newMessagesCount: {
    type: Map,
    of: Number,
    default: {}
  } // Stores new messages count per participant
});

module.exports = mongoose.model('Chat', chatSchema);
