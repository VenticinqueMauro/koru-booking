import { Response } from 'express';
import { prisma } from '../utils/database.js';
import { CreateBookingSchema } from '../models/types.js';
import { conflictValidator } from '../services/ConflictValidator.js';
import { emailService } from '../services/EmailService.js';
import { ZodError } from 'zod';
import { DualAuthRequest } from '../middleware/dualAuth.js';

export class BookingsController {
  async getAll(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { date, status } = req.query;

      const bookings = await prisma.booking.findMany({
        where: {
          accountId: req.accountId,
          ...(date && { date: new Date(date as string) }),
          ...(status && { status: status as string }),
        },
        include: {
          service: {
            select: {
              name: true,
              duration: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      });

      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Error al cargar reservas' });
    }
  }

  async create(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = CreateBookingSchema.parse(req.body);

      // Verify service belongs to account
      const service = await prisma.service.findFirst({
        where: {
          id: validatedData.serviceId,
          accountId: req.accountId,
        },
      });

      if (!service) {
        res.status(404).json({ error: 'Servicio no encontrado' });
        return;
      }

      // Validar y crear con prevención de conflictos (now with accountId)
      const booking = await conflictValidator.validateAndCreateBooking(
        req.accountId,
        validatedData.serviceId,
        validatedData.date,
        validatedData.time,
        {
          name: validatedData.customerName,
          email: validatedData.customerEmail,
          phone: validatedData.customerPhone,
          notes: validatedData.notes,
        }
      );

      // Enviar emails de confirmación (async, no bloqueante)
      emailService.sendBookingConfirmation({
        accountId: req.accountId,
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        customerEmail: booking.customerEmail,
        customerPhone: validatedData.customerPhone,
        notes: validatedData.notes,
      }).catch(err => console.error('Error sending emails:', err));

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        return;
      }

      console.error('Error creating booking:', error);
      res.status(400).json({
        error: (error as Error).message || 'Error al crear reserva'
      });
    }
  }

  async cancel(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      // Verify booking belongs to account
      const existingBooking = await prisma.booking.findFirst({
        where: { id, accountId: req.accountId },
      });

      if (!existingBooking) {
        res.status(404).json({ error: 'Reserva no encontrada' });
        return;
      }

      const booking = await prisma.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      res.json({ message: 'Reserva cancelada', booking });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ error: 'Error al cancelar reserva' });
    }
  }
}

export const bookingsController = new BookingsController();
