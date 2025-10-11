// controllers/notificationController.js
import Notification from '../models/notificationModel.js';

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 }); // Show newest first
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all notifications as read for the logged-in user
// @route   PUT /api/notifications/read
// @access  Private
export const markNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};