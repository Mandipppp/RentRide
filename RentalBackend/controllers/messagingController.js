const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.startChat = async (req, res) => {
  try {
    const { bookingId, ownerId, renterId } = req.body;

    // Check if chat already exists
    let existingChat = await Chat.findOne({ bookingId });
    if (existingChat) return res.status(200).json(existingChat);

    const newChat = new Chat({ bookingId, ownerId, renterId });
    await newChat.save();

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat', error });
  }
};

exports.sendMessage = async (req, res) => {
    try {
      const { chatId, senderId, message } = req.body;
  
      const newMessage = new Message({ chatId, senderId, message });
      await newMessage.save();
  
      // Update chat with new message
      await Chat.findByIdAndUpdate(chatId, { $push: { messages: newMessage._id } });
  
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ message: 'Error sending message', error });
    }
  };


  exports.loadChats = async (req, res) => {
    try {
        // Find the chat using the bookingId
      const chat = await Chat.findOne({ bookingId: req.params.bookingId });
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found for this booking' });
      }
      const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
      res.status(200).json({
        chatId: chat._id,
        messages: messages,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching messages', error });
    }
  };

  exports.markMessagesAsSeen = async (req, res) => {
    try {
      const { chatId, userId } = req.body;
  
      const messages = await Message.updateMany(
        { chatId, senderId: userId, seen: false },
        { $set: { seen: true } }
      );
  
      res.status(200).json({ message: 'Messages marked as seen', messages });
    } catch (error) {
      res.status(500).json({ message: 'Error marking messages as seen', error });
    }
  };
  