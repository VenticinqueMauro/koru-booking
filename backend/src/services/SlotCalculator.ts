import { prisma } from '../utils/database.js';
import { parseISO, format, addMinutes, parse, isBefore, isAfter } from 'date-fns';

export class SlotCalculator {
  /**
   * Calcula los slots disponibles para un servicio en una fecha específica
   * 
   * Algoritmo:
   * 1. Obtener horario comercial del día
   * 2. Obtener todas las reservas existentes
   * 3. Generar slots basados en duración del servicio
   * 4. Filtrar slots ocupados y pasados
   * 5. Aplicar buffer post-servicio
   */
  async calculateAvailableSlots(accountId: string, serviceId: string, dateString: string): Promise<string[]> {
    // 1. Obtener el servicio (scoped by account)
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        accountId: accountId,
      },
    });

    if (!service || !service.active) {
      throw new Error('Servicio no encontrado o inactivo');
    }

    // 2. Obtener el día de la semana (0 = Domingo, 6 = Sábado)
    const date = parseISO(dateString);
    const dayOfWeek = date.getDay();

    // 3. Obtener el horario para ese día (scoped by account)
    const schedule = await prisma.schedule.findFirst({
      where: {
        accountId: accountId,
        dayOfWeek: dayOfWeek,
      },
    });

    if (!schedule || !schedule.enabled) {
      return []; // No hay horario disponible para este día
    }

    // 4. Obtener todas las reservas existentes para esa fecha (scoped by account)
    const existingBookings = await prisma.booking.findMany({
      where: {
        accountId: accountId,
        date,
        status: { not: 'cancelled' },
      },
      select: {
        serviceId: true,
        time: true,
        service: {
          select: {
            duration: true,
            buffer: true,
          },
        },
      },
    });

    // 5. Generar todos los slots posibles
    const allSlots = this.generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      service.duration,
      schedule.breakStart,
      schedule.breakEnd
    );

    // 6. Filtrar slots ocupados
    const occupiedSlots = new Set<string>();

    existingBookings.forEach((booking) => {
      const bookingStartTime = booking.time;
      const totalDuration = booking.service.duration + booking.service.buffer;

      // Marcar como ocupados todos los slots que se solapen con esta reserva
      const bookingStart = this.parseTime(bookingStartTime);
      const bookingEnd = addMinutes(bookingStart, totalDuration);

      allSlots.forEach((slot) => {
        const slotStart = this.parseTime(slot);
        const slotEnd = addMinutes(slotStart, service.duration);

        // Verificar si hay solapamiento
        if (this.timesOverlap(slotStart, slotEnd, bookingStart, bookingEnd)) {
          occupiedSlots.add(slot);
        }
      });
    });

    // 7. Filtrar slots pasados (si la fecha es hoy)
    const now = new Date();
    const isToday = format(now, 'yyyy-MM-dd') === dateString;

    const availableSlots = allSlots.filter((slot) => {
      // Si está ocupado, no está disponible
      if (occupiedSlots.has(slot)) {
        return false;
      }

      // Si es hoy, filtrar slots pasados
      if (isToday) {
        const slotTime = this.parseTime(slot);
        const slotDateTime = new Date(now);
        slotDateTime.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);

        return isAfter(slotDateTime, now);
      }

      return true;
    });

    return availableSlots;
  }

  /**
   * Genera slots de tiempo entre un rango con pausas opcionales
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
    breakStart?: string | null,
    breakEnd?: string | null
  ): string[] {
    const slots: string[] = [];
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    let current = start;

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, durationMinutes);

      // Verificar que el slot completo quepa antes del cierre
      if (isAfter(slotEnd, end)) {
        break;
      }

      const timeString = format(current, 'HH:mm');

      // Verificar si el slot está en el break
      if (breakStart && breakEnd) {
        const breakStartTime = this.parseTime(breakStart);
        const breakEndTime = this.parseTime(breakEnd);

        if (!this.timesOverlap(current, slotEnd, breakStartTime, breakEndTime)) {
          slots.push(timeString);
        }
      } else {
        slots.push(timeString);
      }

      // Avanzar al siguiente slot (cada 15 minutos para mostrar más opciones)
      current = addMinutes(current, 15);
    }

    return slots;
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
    return isBefore(start1, end2) && isAfter(end1, start2);
  }
}

export const slotCalculator = new SlotCalculator();
