// controllers/activityController.js
import Activity from '../models/activityModel.js';

// @desc    Get recent activities for the logged-in organizer
// @route   GET /api/activities
// @access  Private/Organizer
export const getMyActivities = async (req, res) => {
    try {
        // Find the most recent 10 activities for the logged-in user
        const activities = await Activity.find({ organizer: req.user._id })
            .sort({ createdAt: -1 }) // Newest first
            .limit(10);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};