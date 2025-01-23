const express = require('express');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usersRoutes = require('./routes/userRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const resetPassRoutes = require('./routes/resetPassRoutes');
const notificationRoutes = require('./routes/notificationRoutes');



require('dotenv').config();
const app = express();
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






// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/RentRide")
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});