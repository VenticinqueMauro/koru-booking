import { Request, Response } from 'express';
import { format } from 'date-fns';
import { prisma } from '../utils/database.js';
import { EcommerceWebhookSchema, EcommerceWebhookEvent } from '../models/types.js';
import { emailService } from '../services/EmailService.js';
import { ZodError } from 'zod';

export class WebhooksController {
  async handleEcommerce(req: Request, res: Response): Promise<void> {
    try {
      const event = EcommerceWebhookSchema.parse(req.body);

      if (event.type === 'payment_approved') {
        await this.handlePaymentApproved(event);
      } else if (event.type === 'order_cancelled') {
        await this.handleOrderCancelled(event);
      }

      res.json({ received: true });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid webhook payload', details: error.errors });
        return;
      }
      console.error('[Webhook] Error processing ecommerce event:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  }

  private async handlePaymentApproved(event: EcommerceWebhookEvent): Promise<void> {
    const reservationId = event.metadata?.reservationId;

    let reservation = null;

    if (reservationId) {
      reservation = await prisma.bookingReservation.findFirst({
        where: { id: reservationId, status: 'pending' },
        include: { service: { select: { name: true } } },
      });
    }

    // Fallback: buscar por externalOrderId (no debería ocurrir en prod)
    if (!reservation && event.externalOrderId) {
      reservation = await prisma.bookingReservation.findFirst({
        where: { externalOrderId: event.externalOrderId, status: 'pending' },
        include: { service: { select: { name: true } } },
      });
    }

    if (!reservation) {
      console.warn('[Webhook] No reservation found for payment_approved event', {
        reservationId,
        externalOrderId: event.externalOrderId,
      });
      return;
    }

    const customerName = event.customer?.name || reservation.customerName || 'Cliente';
    const customerEmail = event.customer?.email || reservation.customerEmail || '';
    const customerPhone = event.customer?.phone || reservation.customerPhone || undefined;

    if (!customerEmail) {
      console.warn('[Webhook] No customer email available, booking will be created without email confirmation');
    }

    const serviceName = reservation.service?.name ?? 'Servicio';

    const booking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          accountId: reservation.accountId,
          serviceId: reservation.serviceId,
          date: reservation.date,
          time: reservation.time,
          customerName,
          customerEmail,
          customerPhone,
          notes: reservation.notes || undefined,
          status: 'confirmed',
        },
      });

      await tx.bookingReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'confirmed',
          bookingId: booking.id,
          externalOrderId: event.externalOrderId,
          customerName,
          customerEmail,
        },
      });

      return booking;
    });

    if (customerEmail) {
      emailService.sendBookingConfirmation({
        accountId: reservation.accountId,
        customerName,
        serviceName,
        date: format(booking.date, 'yyyy-MM-dd'),
        time: booking.time,
        customerEmail,
        customerPhone,
      }).catch(err => console.error('[Webhook] Error sending confirmation emails:', err));
    }

    console.log(`[Webhook] Booking confirmed: ${booking.id} from reservation: ${reservation.id}`);
  }

  private async handleOrderCancelled(event: EcommerceWebhookEvent): Promise<void> {
    const reservationId = event.metadata?.reservationId;

    // Buscar reserva temporal pendiente
    if (reservationId) {
      const reservation = await prisma.bookingReservation.findFirst({
        where: { id: reservationId, status: 'pending' },
      });

      if (reservation) {
        await prisma.bookingReservation.update({
          where: { id: reservation.id },
          data: { status: 'cancelled' },
        });
        console.log(`[Webhook] Reservation cancelled: ${reservation.id}`);
        return;
      }
    }

    // Buscar booking confirmado para cancelar
    const reservation = await prisma.bookingReservation.findFirst({
      where: {
        ...(reservationId ? { id: reservationId } : { externalOrderId: event.externalOrderId }),
        status: 'confirmed',
      },
    });

    if (reservation?.bookingId) {
      await prisma.booking.update({
        where: { id: reservation.bookingId },
        data: { status: 'cancelled' },
      });
      await prisma.bookingReservation.update({
        where: { id: reservation.id },
        data: { status: 'cancelled' },
      });
      console.log(`[Webhook] Booking cancelled: ${reservation.bookingId}`);
    } else {
      console.warn('[Webhook] No booking/reservation found for order_cancelled event', {
        reservationId,
        externalOrderId: event.externalOrderId,
      });
    }
  }
}

export const webhooksController = new WebhooksController();
