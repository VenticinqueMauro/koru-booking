import { Response } from 'express';
import { parseISO, addMinutes } from 'date-fns';
import { prisma } from '../utils/database.js';
import { CreateReservationSchema } from '../models/types.js';
import { ZodError } from 'zod';
import { DualAuthRequest } from '../middleware/dualAuth.js';

export class ReservationsController {
  async create(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = CreateReservationSchema.parse(req.body);

      const service = await prisma.service.findFirst({
        where: { id: validatedData.serviceId, accountId: req.accountId },
      });

      if (!service || !service.active) {
        res.status(404).json({ error: 'Servicio no encontrado o inactivo' });
        return;
      }

      const dateObj = parseISO(validatedData.date);
      const ttlMinutes = validatedData.ttlMinutes ?? (await this.getReservationTTL(req.accountId));
      const expiresAt = addMinutes(new Date(), ttlMinutes);
      const accountId = req.accountId;

      const reservation = await prisma.$transaction(async (tx) => {
        // Lazy cleanup inside transaction
        await tx.bookingReservation.updateMany({
          where: { accountId, status: 'pending', expiresAt: { lt: new Date() } },
          data: { status: 'expired' },
        });

        const existingBooking = await tx.booking.findFirst({
          where: {
            accountId,
            serviceId: validatedData.serviceId,
            date: dateObj,
            time: validatedData.time,
            status: { not: 'cancelled' },
          },
        });

        if (existingBooking) {
          throw new Error('El slot ya está reservado');
        }

        const existingReservation = await tx.bookingReservation.findFirst({
          where: {
            accountId,
            serviceId: validatedData.serviceId,
            date: dateObj,
            time: validatedData.time,
            status: 'pending',
            expiresAt: { gt: new Date() },
          },
        });

        if (existingReservation) {
          throw new Error('El slot ya tiene una reserva temporal activa');
        }

        return tx.bookingReservation.create({
          data: {
            accountId,
            serviceId: validatedData.serviceId,
            date: dateObj,
            time: validatedData.time,
            customerName: validatedData.customerName,
            customerEmail: validatedData.customerEmail,
            customerPhone: validatedData.customerPhone,
            status: 'pending',
            expiresAt,
          },
        });
      });

      res.status(201).json({
        reservationId: reservation.id,
        status: reservation.status,
        expiresAt: reservation.expiresAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message || 'Error al crear reserva temporal' });
    }
  }

  async getAll(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const reservations = await prisma.bookingReservation.findMany({
        where: {
          accountId: req.accountId,
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
        include: {
          service: { select: { name: true, duration: true } },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      });

      res.json(reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({ error: 'Error al cargar reservas temporales' });
    }
  }

  async getById(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const reservation = await prisma.bookingReservation.findFirst({
        where: { id: req.params.id, accountId: req.accountId },
        include: { service: { select: { name: true, duration: true } } },
      });

      if (!reservation) {
        res.status(404).json({ error: 'Reserva temporal no encontrada' });
        return;
      }

      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener reserva temporal' });
    }
  }

  async cancel(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const reservation = await prisma.bookingReservation.findFirst({
        where: { id: req.params.id, accountId: req.accountId, status: 'pending' },
      });

      if (!reservation) {
        res.status(404).json({ error: 'Reserva temporal no encontrada o ya procesada' });
        return;
      }

      await prisma.bookingReservation.update({
        where: { id: reservation.id },
        data: { status: 'cancelled' },
      });

      res.json({ message: 'Reserva temporal cancelada' });
    } catch (error) {
      res.status(500).json({ error: 'Error al cancelar reserva temporal' });
    }
  }

  private async getReservationTTL(accountId: string): Promise<number> {
    const settings = await prisma.widgetSettings.findUnique({
      where: { accountId },
      select: { reservationTTL: true },
    });
    return settings?.reservationTTL ?? 30;
  }
}

export const reservationsController = new ReservationsController();
