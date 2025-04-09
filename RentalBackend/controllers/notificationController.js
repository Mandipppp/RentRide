const Notification = require('../models/notification');
const User = require('../models/user');
const Owner = require('../models/owner');

exports.getNotifications = async (req, res) => {
  try {
    const recipient = req.user; 

    // Determine the model 
    let recipientModel;
    if (recipient.role === 'renter' || recipient.role === 'admin' || recipient.role === 'superadmin') {
      recipientModel = 'User';
    } else if (recipient.role === 'owner') {
      recipientModel = 'Owner';
    }

    // Fetch notifications based on recipientId and recipientModel
    const notifications = await Notification.find({
      recipientId: recipient.id,
      recipientModel: recipientModel,
    })
      .populate('recipient') // Populate recipient
      .sort({ createdAt: -1 }); // Sort notifications by creation date

    // Return the notifications
    res.status(200).json({ notifications, id: recipient.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};

exports.markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    // Find and update the notification to mark as read
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: 'read' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};
