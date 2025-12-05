import { z } from 'zod';

// Zod Schemas para validación

export const CreateServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  duration: z.number().int().positive('La duración debe ser un número positivo'),
  price: z.number().positive().optional().nullable(),
  buffer: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
  active: z.boolean().default(true),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export const CreateScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  enabled: z.boolean().default(true),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  breakStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  breakEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
});

export const UpdateScheduleSchema = CreateScheduleSchema.partial();

export const CreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateWidgetSettingsSchema = z.object({
  layout: z.enum(['list', 'grid', 'button']).default('list'),
  stepInterval: z.number().int().positive().default(30),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color hexadecimal inválido').default('#00C896'),
  notifyEmail: z.string().email(),
  timezone: z.string().default('America/Mexico_City'),
});

export const GetSlotsQuerySchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
});

// TypeScript Types

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateWidgetSettingsInput = z.infer<typeof UpdateWidgetSettingsSchema>;
export type GetSlotsQuery = z.infer<typeof GetSlotsQuerySchema>;

// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
