// services/notificationService.js
import sgMail from '@sendgrid/mail';
import Notification from '../models/notificationModel.js'; // <-- 1. IMPORT OUR NEW NOTIFICATION MODEL

// This part for SendGrid remains exactly the same
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendPurchaseConfirmationEmail = async (user, ticket, event) => {
  const msg = {
    to: user.email,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    subject: `Your Ticket for ${event.name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h1 style="color: #6366F1;">Hi ${user.name},</h1>
        <p>Thank you for your purchase! You're all set for the event. Here are your ticket details:</p>
        <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; background-color: #f7fafc;">
          <h2 style="margin-top: 0; color: #4F46E5;">${event.name}</h2>
          <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
            <li style="margin-bottom: 10px;"><strong>Location:</strong> ${event.location}</li>
            <li style="margin-bottom: 10px;"><strong>Price Paid:</strong> ₹${ticket.purchasePrice}</li>
            <li style="margin-bottom: 10px;"><strong>Your Unique NFT Ticket ID:</strong> #${ticket.nftTokenId}</li>
          </ul>
        </div>
        <p>We look forward to seeing you there!</p>
        <p>- The Evently Team</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Purchase confirmation email sent to ${user.email} via SendGrid.`);
  } catch (error) {
    console.error(`❌ Error sending email via SendGrid to ${user.email}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

export const sendEventReminderEmail = async (user, event) => {
  // ... this function remains unchanged
  const msg = {
    to: user.email,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    subject: `Reminder: ${event.name} is tomorrow!`,
    html: `...`,
  };
  try {
    await sgMail.send(msg);
    console.log(`✅ Event reminder sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Error sending reminder to ${user.email}:`, error);
  }
};


// --- 2. THIS IS THE NEW FUNCTION FOR IN-APP NOTIFICATIONS ---
/**
 * A reusable function to create a new in-app notification in the database.
 * @param {string} userId - The ID of the user who will receive the notification.
 * @param {string} message - The notification message text.
 * @param {string} type - The type of notification (e.g., 'invitation').
 * @param {string} link - The URL the user should be taken to when they click.
 */
export const createInAppNotification = async (userId, message, type, link) => {
  try {
    await Notification.create({
      user: userId,
      message,
      type,
      link,
    });
    console.log(`✅ In-app notification created for user ${userId}: "${message}"`);
  } catch (error) {
    console.error('❌ Error creating in-app notification:', error);
  }
};