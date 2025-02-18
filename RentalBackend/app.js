const express = require('express');
const http = require('http'); // HTTP for Socket.IO
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usersRoutes = require('./routes/userRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const resetPassRoutes = require('./routes/resetPassRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userBookingRoutes = require('./routes/userBookingRoutes');
const ownerBookingRoutes = require('./routes/ownerBookingRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/userReviewRoutes");

const Chat = require('./models/Chat');
const Message = require('./models/Message');

require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const mongoose = require("mongoose");
const cors = require('cors')
/////////////
const path = require('path'); // Import for static file serving
/////////////
app.use(cors())

const port = 3000;



app.use(express.json());
///////////////////
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
///////////////////////////////

app.use('/api/auth', authRoutes);
app.use('/api/auth', resetPassRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/user/booking', userBookingRoutes);
app.use('/api/user/review', reviewRoutes);

app.use('/api/owner/booking', ownerBookingRoutes);


// Payment Routes
app.use("/api/auth/payment", paymentRoutes);


// message route
app.use("/api/auth/chat", messageRoutes);

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/RentRide")
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

  // Real-Time Chat with Socket.IO
const users = new Map(); // Store active users

io.on('connection', (socket) => {
  // console.log('A user connected:', socket.id);

  // User joins a chat room
  socket.on('joinChat', ({ chatId, userId }) => {
    socket.join(chatId);
    users.set(userId, socket.id);
    // console.log(`User ${userId} joined chat ${chatId}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async ({ chatId, senderId, message }) => {
    try {
      const newMessage = new Message({ chatId, senderId, message });
      await newMessage.save();

      // Update chat with new message
      await Chat.findByIdAndUpdate(chatId, { $push: { messages: newMessage._id } });

      // Broadcast the message to all users in the chat
      io.to(chatId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle marking messages as seen
  socket.on("markSeen", async ({ chatId, userId }) => {
    try {
      // Update messages where sender is NOT the current user and seen is false
      await Message.updateMany(
        { chatId, senderId: { $ne: userId }, seen: false },
        { $set: { seen: true } }
      );

      // Notify all users in the chat that messages have been seen
      io.to(chatId).emit("messagesSeen", { chatId, userId });
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    // console.log('User disconnected:', socket.id);
    users.forEach((value, key) => {
      if (value === socket.id) {
        users.delete(key);
      }
    });
  });
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});