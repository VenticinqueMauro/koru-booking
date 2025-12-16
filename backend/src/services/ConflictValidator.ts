import { prisma, withTransaction } from '../utils/database.js';
import { parseISO, addMinutes, parse } from 'date-fns';
import type { PrismaClient } from '@prisma/client';

export class ConflictValidator {
  /**
   * Valida que un slot esté disponible antes de crear una reserva
   * Usa transacciones para evitar race conditions
   */
  async validateAndCreateBooking(
    accountId: string,
    serviceId: string,
    dateString: string,
    time: string,
    customerData: {
      name: string;
      email: string;
      phone?: string;
      notes?: string;
    }
  ): Promise<any> {
    return withTransaction(async (tx) => {
      // 1. Obtener el servicio con lock (scoped by account)
      const service = await tx.service.findFirst({
        where: {
          id: serviceId,
          accountId: accountId,
        },
      });

      if (!service || !service.active) {
        throw new Error('Servicio no encontrado o inactivo');
      }

      const date = parseISO(dateString);

      // 2. Verificar si ya existe una reserva en ese slot (con lock, scoped by account)
      const existingBooking = await tx.booking.findFirst({
        where: {
          accountId: accountId,
          serviceId,
          date,
          time,
        },
      });

      if (existingBooking) {
        throw new Error('Lo sentimos, este horario acaba de ser ocupado. Por favor selecciona otro.');
      }

      // 3. Verificar conflictos con otras reservas (considerando duración + buffer)
      const hasConflict = await this.checkTimeConflicts(
        tx,
        accountId,
        serviceId,
        date,
        time,
        service.duration,
        service.buffer
      );

      if (hasConflict) {
        throw new Error('Este horario entra en conflicto con otra reserva. Por favor selecciona otro.');
      }

      // 4. Crear la reserva
      const booking = await tx.booking.create({
        data: {
          accountId,
          serviceId,
          date,
          time,
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          notes: customerData.notes,
          status: 'confirmed',
        },
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        id: booking.id,
        serviceId: booking.serviceId,
        serviceName: booking.service.name,
        date: dateString,
        time: booking.time,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        status: booking.status,
      };
    });
  }

  /**
   * Verifica si hay conflictos de tiempo con otras reservas
   */
  private async checkTimeConflicts(
    tx: PrismaClient,
    accountId: string,
    serviceId: string,
    date: Date,
    time: string,
    duration: number,
    buffer: number
  ): Promise<boolean> {
    // Obtener todas las reservas del día (scoped by account)
    const dayBookings = await tx.booking.findMany({
      where: {
        accountId: accountId,
        date,
        status: { not: 'cancelled' },
      },
      include: {
        service: {
          select: {
            duration: true,
            buffer: true,
          },
        },
      },
    });

    const newBookingStart = this.parseTime(time);
    const newBookingEnd = addMinutes(newBookingStart, duration + buffer);

    // Verificar solapamiento con cada reserva existente
    for (const booking of dayBookings) {
      const existingStart = this.parseTime(booking.time);
      const existingEnd = addMinutes(
        existingStart,
        booking.service.duration + booking.service.buffer
      );

      if (this.timesOverlap(newBookingStart, newBookingEnd, existingStart, existingEnd)) {
        return true; // Hay conflicto
      }
    }

    return false; // No hay conflicto
  }

  /**
   * Parsea un string de tiempo HH:mm a Date
   */
  private parseTime(timeString: string): Date {
    return parse(timeString, 'HH:mm', new Date());
  }

  /**
   * Verifica si dos rangos de tiempo se solapan
   */
  private timesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }
}

export const conflictValidator = new ConflictValidator();
