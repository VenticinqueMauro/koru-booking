import { format, parse, isAfter, isBefore, startOfDay, addMinutes, isToday } from 'date-fns';

/**
 * Formatea una fecha a string YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Formatea una hora a string HH:mm
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Parsea un string de fecha YYYY-MM-DD a Date
 */
export function parseDate(dateString: string): Date {
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

/**
 * Parsea un string de hora HH:mm a Date (fecha de hoy)
 */
export function parseTime(timeString: string): Date {
  return parse(timeString, 'HH:mm', new Date());
}

/**
 * Verifica si un slot ya pasó (considerando fecha y hora)
 */
export function isSlotPast(date: string, time: string): boolean {
  const slotDate = parseDate(date);
  const [hours, minutes] = time.split(':').map(Number);
  
  const slotDateTime = new Date(slotDate);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  return isBefore(slotDateTime, new Date());
}

/**
 * Genera un array de horas disponibles entre un rango
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number
): string[] {
  const slots: string[] = [];
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  let current = start;
  
  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    slots.push(formatTime(current));
    current = addMinutes(current, intervalMinutes);
  }
  
  return slots;
}

/**
 * Formatea una fecha para mostrar al usuario (ej: "Lunes, 15 de Enero")
 */
export function formatDisplayDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", { locale: undefined });
}

/**
 * Obtiene el nombre del día de la semana
 */
export function getDayName(date: Date): string {
  return format(date, 'EEEE');
}

/**
 * Verifica si una fecha es hoy
 */
export function checkIsToday(date: Date): boolean {
  return isToday(date);
}
