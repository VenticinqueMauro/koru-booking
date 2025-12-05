import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { CreateBookingSchema } from '../models/types.js';
import { conflictValidator } from '../services/ConflictValidator.js';
import { emailService } from '../services/EmailService.js';
import { ZodError } from 'zod';

export class BookingsController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { date, status } = req.query;
      
      const bookings = await prisma.booking.findMany({
        where: {
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

  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateBookingSchema.parse(req.body);

      // Validar y crear con prevención de conflictos
      const booking = await conflictValidator.validateAndCreateBooking(
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

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

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
