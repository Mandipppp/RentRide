const mongoose = require('mongoose');
const socketManager = require("../socket");

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientModel: { type: String, enum: ['User', 'Owner'], required: true }, // Specifies whether the recipient is a User or Owner
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'kyc', 'payment', 'system', 'vehicle'], required: true },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

// Dynamically populate based on recipientModel
NotificationSchema.virtual('recipient', {
  refPath: 'recipientModel',
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true,
});

// ** Real-time notification trigger **
NotificationSchema.post("save", function (doc) {
  const io = require("../socket").getIo();
  const users = require("../app").users;
  
  try {
    const recipientSocketId = users.get(doc.recipientId.toString()); // Convert ObjectId to string
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newNotification", doc);
      // console.log("Notification emitted to:", recipientSocketId);
    }
  } catch (error) {
    console.error("Error emitting notification:", error);
  }

});

module.exports = mongoose.model('Notification', NotificationSchema);