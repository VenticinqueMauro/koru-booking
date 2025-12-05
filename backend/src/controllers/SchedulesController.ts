import { Request, Response } from 'express';
import { prisma, handleDatabaseError } from '../utils/database.js';
import { CreateScheduleSchema, UpdateScheduleSchema } from '../models/types.js';
import { ZodError } from 'zod';

export class SchedulesController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await prisma.schedule.findMany({
        orderBy: { dayOfWeek: 'asc' },
      });
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Error al cargar horarios' });
    }
  }

  async createOrUpdate(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateScheduleSchema.parse(req.body);

      const schedule = await prisma.schedule.upsert({
        where: { dayOfWeek: validatedData.dayOfWeek },
        update: validatedData,
        create: validatedData,
      });

      res.json(schedule);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        return;
      }
      console.error('Error saving schedule:', error);
      res.status(500).json({ error: handleDatabaseError(error) });
    }
  }
}

export const schedulesController = new SchedulesController();
