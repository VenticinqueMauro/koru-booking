import { Response } from 'express';
import { prisma, handleDatabaseError } from '../utils/database.js';
import { CreateScheduleSchema, UpdateScheduleSchema } from '../models/types.js';
import { ZodError } from 'zod';
import { DualAuthRequest } from '../middleware/dualAuth.js';

export class SchedulesController {
  async getAll(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const schedules = await prisma.schedule.findMany({
        where: { accountId: req.accountId },
        orderBy: { dayOfWeek: 'asc' },
      });
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Error al cargar horarios' });
    }
  }

  async createOrUpdate(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = CreateScheduleSchema.parse(req.body);

      const schedule = await prisma.schedule.upsert({
        where: {
          accountId_dayOfWeek: {
            accountId: req.accountId,
            dayOfWeek: validatedData.dayOfWeek,
          }
        },
        update: validatedData,
        create: {
          ...validatedData,
          accountId: req.accountId,
        },
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
