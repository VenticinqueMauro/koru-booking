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
  async calculateAvailableSlots(accountId: string, serviceId: string, dateString: string, stepInterval?: number): Promise<string[]> {
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
    // NOTA: parseISO interpreta la fecha en la timezone local del servidor
    // TODO: Usar date-fns-tz para manejar timezone correctamente desde WidgetSettings
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

    // 4. Obtener configuración del widget si no se proporciona stepInterval
    const interval = stepInterval ?? (await this.getStepInterval(accountId));

    // 5. Obtener todas las reservas existentes para esa fecha (scoped by account)
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

    // 6. Generar todos los slots posibles
    const allSlots = this.generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      service.duration,
      interval,
      schedule.breakStart,
      schedule.breakEnd
    );

    // 7. Filtrar slots ocupados
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

    // 8. Filtrar slots pasados (si la fecha es hoy)
    // NOTA: 'now' usa la timezone del servidor
    // TODO: Obtener timezone de WidgetSettings y usar date-fns-tz para comparación correcta
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
   * Obtiene el stepInterval configurado para el account
   */
  private async getStepInterval(accountId: string): Promise<number> {
    const settings = await prisma.widgetSettings.findUnique({
      where: { accountId },
      select: { stepInterval: true },
    });
    return settings?.stepInterval ?? 30;
  }

  /**
   * Obtiene el timezone configurado para el account
   * TODO: Usar este timezone en los cálculos de slots con date-fns-tz
   */
  private async getTimezone(accountId: string): Promise<string> {
    const settings = await prisma.widgetSettings.findUnique({
      where: { accountId },
      select: { timezone: true },
    });
    return settings?.timezone ?? 'America/Argentina/Buenos_Aires';
  }

  /**
   * Genera slots de tiempo entre un rango con pausas opcionales
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
    stepInterval: number,
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

      // Avanzar al siguiente slot usando el intervalo configurado
      current = addMinutes(current, stepInterval);
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
