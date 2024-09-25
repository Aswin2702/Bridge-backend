const Startup = require('../models/startupSchema');
const VC = require('../models/vcSchema');
const Chat = require('./../models/chatSchema');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.sendMessage = catchAsync(async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;
  let chat = await Chat.findOne({
    participants: { $all: [senderId, receiverId] }
  });

  if (!chat) {
    chat = new Chat({
      participants: [senderId, receiverId],
      messages: [],
      newMessagesCount: { [receiverId]: 0 }
    });
  }

  const newMessage = { sender: senderId, content };
  chat.messages.push(newMessage);
  chat.lastUpdated = new Date();

  // Increment new message count for the receiver
  if (!chat.newMessagesCount.get(receiverId)) {
    chat.newMessagesCount.set(receiverId, 0);
  }
  chat.newMessagesCount.set(
    receiverId,
    chat.newMessagesCount.get(receiverId) + 1
  );

  await chat.save();

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: chat
  });
});

exports.markAsSeen = catchAsync(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  chat.messages.forEach((message) => {
    if (message.sender.toString() !== userId && !message.seen) {
      message.seen = true;
    }
  });

  // Reset new message count for this user
  chat.newMessagesCount.set(userId, 0);

  await chat.save();

  res.status(200).json({ success: true, message: 'Messages marked as seen' });
});

// History of Message
exports.historyMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const chats = await Chat.find({
    participants: userId
  }).populate('participants', 'name role');

  const chatHistory = await Promise.all(
    chats.map(async (chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== userId
      );

      const userRole = otherParticipant.role;
      const companyDetails =
        userRole === 'startup'
          ? await Startup.findOne({ user: otherParticipant._id.toString() })
          : await VC.findOne({ user: otherParticipant._id.toString() });
      return {
        chatId: chat._id,
        otherParticipantId: otherParticipant
          ? otherParticipant._id.toString()
          : null,
        otherParticipantName: otherParticipant ? otherParticipant.name : null,
        fromCompany: companyDetails ? companyDetails.firmName : null,
        messages: chat.messages,
        newMessagesCount: chat.newMessagesCount.get(userId) || 0,
        lastUpdated: chat.lastUpdated
      };
    })
  );

  res.status(200).json({ status: 'success', chatHistory });
});

// Get specific chat
exports.specificChat = catchAsync(async (req, res, next) => {
  const { chatId } = req.body;
  const { id } = req.user;
  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new AppError('No chat matching this id.', 404));
  }

  const messages = [];
  chat.messages.forEach((m) => {
    const editedMessage = m;
    if (m.sender === id) editedMessage = { ...m, otherParticipant: true };
    messages.add(editedMessage);
  });

  res.status(200).json({ status: 'success', messages });
});
