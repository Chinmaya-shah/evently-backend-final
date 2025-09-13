// services/notificationService.js
import sgMail from '@sendgrid/mail';

// 1. Set the API Key immediately after importing the library.
// This is crucial for the service to be initialized correctly.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a ticket purchase confirmation email using SendGrid.
 * @param {object} user - The user object (must contain name and email).
 * @param {object} ticket - The ticket object from the database.
 * @param {object} event - The event object.
 */
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

/**
 * Sends an event reminder email.
 * @param {object} user - The user object (must contain name and email).
 * @param {object} event - The event object.
 */
export const sendEventReminderEmail = async (user, event) => {
  const msg = {
    to: user.email,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    subject: `Reminder: ${event.name} is tomorrow!`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #6366F1;">Hi ${user.name},</h1>
        <p>This is a friendly reminder that the event, <strong>${event.name}</strong>, is happening tomorrow!</p>
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
          <h2 style="margin-top: 0; color: #4F46E5;">Event Details</h2>
          <ul>
            <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()} at ${new Date(event.date).toLocaleTimeString()}</li>
            <li><strong>Location:</strong> ${event.location}</li>
          </ul>
        </div>
        <p>We're excited to see you there!</p>
        <p>- The Evently Team</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Event reminder sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Error sending reminder to ${user.email}:`, error);
  }
};
