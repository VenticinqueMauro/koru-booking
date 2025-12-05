import { Request, Response } from 'express';
import { GetSlotsQuerySchema } from '../models/types.js';
import { slotCalculator } from '../services/SlotCalculator.js';
import { ZodError } from 'zod';

export class SlotsController {
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = GetSlotsQuerySchema.parse(req.query);

      const slots = await slotCalculator.calculateAvailableSlots(
        validatedQuery.serviceId,
        validatedQuery.date
      );

      res.json({ slots });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Parámetros inválidos', details: error.errors });
        return;
      }
      
      console.error('Error calculating slots:', error);
      res.status(500).json({ 
        error: (error as Error).message || 'Error al calcular disponibilidad' 
      });
    }
  }
}

export const slotsController = new SlotsController();
