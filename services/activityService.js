// services/activityService.js
import Activity from '../models/activityModel.js';

/**
 * A reusable function to log a new activity for an organizer.
 * @param {string} organizerId - The ID of the organizer to associate the activity with.
 * @param {string} message - The activity message text.
 * @param {'event' | 'ticket' | 'payment'} type - The type of activity.
 * @param {string} [link] - An optional URL link for the activity.
 */
export const logActivity = async (organizerId, message, type, link = '') => {
    try {
        await Activity.create({
            organizer: organizerId,
            message,
            type,
            link,
        });
        console.log(`✅ Activity logged for organizer ${organizerId}: "${message}"`);
    } catch (error) {
        console.error('❌ Error logging activity:', error);
    }
};