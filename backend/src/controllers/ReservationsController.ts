import { Request, Response } from 'express';
import { parseISO, addMinutes } from 'date-fns';
import { prisma } from '../utils/database.js';
import { CreateReservationSchema } from '../models/types.js';
import { ZodError } from 'zod';
import { DualAuthRequest } from '../middleware/dualAuth.js';
import { env } from '../config/env.js';

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

  /**
   * Multi-key match endpoint used by koru-triggers Worker as fallback when
   * no reservationId came through the orderForm (client sync failed: cookie
   * cleared, device switch, etc). Matches pending reservations by ANY of
   * email/phone/document within a time window, scoped to a websiteId.
   *
   * Auth: x-webhook-secret header, shared secret with koru-triggers Worker.
   */
  async match(req: Request, res: Response): Promise<void> {
    try {
      const expectedSecret = env.KORU_TRIGGERS_WEBHOOK_SECRET;
      if (!expectedSecret) {
        res.status(500).json({ error: 'Match endpoint not configured' });
        return;
      }

      if (req.headers['x-webhook-secret'] !== expectedSecret) {
        res.status(401).json({ error: 'Invalid secret' });
        return;
      }

      const websiteId = String(req.query.websiteId ?? '');
      if (!websiteId) {
        res.status(400).json({ error: 'websiteId is required' });
        return;
      }

      const email = optionalString(req.query.email);
      const phone = optionalString(req.query.phone);
      const document = optionalString(req.query.document);

      if (!email && !phone && !document) {
        res.status(400).json({ error: 'At least one of email/phone/document is required' });
        return;
      }

      const after = optionalString(req.query.after);
      const afterDate = after ? new Date(after) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (isNaN(afterDate.getTime())) {
        res.status(400).json({ error: 'Invalid "after" timestamp' });
        return;
      }

      const account = await prisma.account.findUnique({ where: { websiteId } });
      if (!account) {
        res.status(404).json({ error: 'Account not found for websiteId' });
        return;
      }

      const orMatchers: Array<Record<string, string>> = [];
      if (email) orMatchers.push({ customerEmail: email });
      if (phone) orMatchers.push({ customerPhone: phone });
      // document match would require schema addition; left for future

      const reservation = await prisma.bookingReservation.findFirst({
        where: {
          accountId: account.id,
          status: 'pending',
          createdAt: { gte: afterDate },
          OR: orMatchers,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!reservation) {
        res.status(404).json({ error: 'No matching pending reservation' });
        return;
      }

      res.json({ reservationId: reservation.id });
    } catch (error) {
      console.error('[Match] Error:', error);
      res.status(500).json({ error: 'Error matching reservation' });
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

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export const reservationsController = new ReservationsController();
