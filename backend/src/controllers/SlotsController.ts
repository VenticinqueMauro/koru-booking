import { Response } from 'express';
import { GetSlotsQuerySchema } from '../models/types.js';
import { slotCalculator } from '../services/SlotCalculator.js';
import { ZodError } from 'zod';
import { DualAuthRequest } from '../middleware/dualAuth.js';

export class SlotsController {
  async getAvailableSlots(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedQuery = GetSlotsQuerySchema.parse(req.query);

      const slots = await slotCalculator.calculateAvailableSlots(
        req.accountId,
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
