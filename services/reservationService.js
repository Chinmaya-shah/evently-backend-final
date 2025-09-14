// services/reservationService.js

import cron from 'node-cron';
import GroupReservation from '../models/groupReservationModel.js';
import Ticket from '../models/ticketModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import { mintTicket } from './blockchainService.js';
import { sendPurchaseConfirmationEmail } from './notificationService.js';

const finalizeReservations = async () => {
  console.log('⏰ Running reservation finalizer cron job...');

  try {
    const expiredReservations = await GroupReservation.find({
      status: 'pending',
      expiresAt: { $lt: new Date() },
    });

    if (expiredReservations.length === 0) {
      console.log('No expired reservations to process.');
      return;
    }

    for (const reservation of expiredReservations) {
      console.log(`Processing reservation ID: ${reservation._id}`);

      const associatedTickets = await Ticket.find({ groupReservation: reservation._id });
      const acceptedTickets = associatedTickets.filter(t => t.status === 'accepted');
      const otherTickets = associatedTickets.filter(t => t.status !== 'accepted');

      if (acceptedTickets.length > 0) {
        console.log(`${acceptedTickets.length} ticket(s) were accepted. Finalizing purchase...`);

        const event = await Event.findById(reservation.event);
        if (!event) {
            console.error(`Event not found for reservation ${reservation._id}. Skipping.`);
            continue; // Skip to the next reservation
        }

        for (const ticket of acceptedTickets) {
          const attendee = await User.findById(ticket.attendee);

          const attendeeWalletAddress = '0x639958B29d0c7F3bA1Ccc1aeaBAd1e60e783b5F8';
          const tokenId = await mintTicket(attendeeWalletAddress);

          ticket.nftTokenId = tokenId;
          ticket.status = 'confirmed';
          await ticket.save();

          sendPurchaseConfirmationEmail(attendee, ticket, event);
        }

        // --- THIS IS THE CRITICAL FIX ---
        // We now update the main event's sold count with the number of accepted tickets.
        event.ticketsSold += acceptedTickets.length;
        await event.save();
        console.log(`Updated event ${event.name}. New tickets sold count: ${event.ticketsSold}`);
        // --- END OF FIX ---

        reservation.status = 'completed';
        await reservation.save();

      } else {
        console.log('No tickets were accepted for this reservation.');
        reservation.status = 'completed';
        await reservation.save();
      }

      for (const ticket of otherTickets) {
        ticket.status = 'expired';
        await ticket.save();
      }
    }
  } catch (error) {
    console.error('Error during reservation finalization:', error);
  }
};

export const startReservationFinalizer = () => {
  cron.schedule('*/1 * * * *', finalizeReservations);
  console.log('✅ Reservation finalizer cron job started. Will run every minute.');
};