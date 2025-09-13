// scheduler.js
import cron from 'node-cron';
import Event from './models/eventModel.js';
import Ticket from './models/ticketModel.js';
import { sendEventReminderEmail } from './services/notificationService.js';

const checkAndSendReminders = async () => {
  console.log('Scheduler running: Checking for upcoming events...');

  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twentyFiveHoursLater = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  try {
    // Find events that are scheduled to start between 24 and 25 hours from now
    const upcomingEvents = await Event.find({
      date: {
        $gte: twentyFourHoursLater,
        $lt: twentyFiveHoursLater,
      },
    });

    if (upcomingEvents.length === 0) {
      console.log('No events found for reminders in the next hour.');
      return;
    }

    for (const event of upcomingEvents) {
      console.log(`Found upcoming event: ${event.name}. Finding attendees...`);

      // Find all tickets for this event
      const tickets = await Ticket.find({ event: event._id }).populate('attendee');

      // Send a reminder to each attendee
      for (const ticket of tickets) {
        if (ticket.attendee) {
          await sendEventReminderEmail(ticket.attendee, event);
        }
      }
    }
  } catch (error) {
    console.error('Error in scheduler:', error);
  }
};

// Schedule the job to run once every hour, at the top of the hour.
const startScheduler = () => {
  cron.schedule('0 * * * *', checkAndSendReminders);
  console.log('🕒 Event reminder scheduler started. Will run every hour.');
};

export default startScheduler;