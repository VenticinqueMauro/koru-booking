import { Response } from 'express';
import { prisma, handleDatabaseError } from '../utils/database.js';
import { CreateServiceSchema, UpdateServiceSchema } from '../models/types.js';
import { ZodError } from 'zod';
import { DualAuthRequest } from '../middleware/dualAuth.js';

export class ServicesController {
  /**
   * GET /api/services - Obtener todos los servicios activos (scoped by account)
   */
  async getAll(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const services = await prisma.service.findMany({
        where: {
          accountId: req.accountId,
          active: true
        },
        orderBy: { name: 'asc' },
      });

      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Error al cargar servicios' });
    }
  }

  /**
   * GET /api/services/:id - Obtener un servicio específico (scoped by account)
   */
  async getOne(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const service = await prisma.service.findFirst({
        where: {
          id,
          accountId: req.accountId
        },
      });

      if (!service) {
        res.status(404).json({ error: 'Servicio no encontrado' });
        return;
      }

      res.json(service);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ error: 'Error al cargar servicio' });
    }
  }

  /**
   * POST /api/services - Crear un nuevo servicio (scoped by account)
   */
  async create(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = CreateServiceSchema.parse(req.body);

      const service = await prisma.service.create({
        data: {
          ...validatedData,
          accountId: req.accountId,
        },
      });

      res.status(201).json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        return;
      }

      console.error('Error creating service:', error);
      res.status(500).json({ error: handleDatabaseError(error) });
    }
  }

  /**
   * PUT /api/services/:id - Actualizar un servicio (scoped by account)
   */
  async update(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const validatedData = UpdateServiceSchema.parse(req.body);

      // Verify service belongs to account
      const existingService = await prisma.service.findFirst({
        where: { id, accountId: req.accountId },
      });

      if (!existingService) {
        res.status(404).json({ error: 'Servicio no encontrado' });
        return;
      }

      const service = await prisma.service.update({
        where: { id },
        data: validatedData,
      });

      res.json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        return;
      }

      console.error('Error updating service:', error);
      res.status(500).json({ error: handleDatabaseError(error) });
    }
  }

  /**
   * DELETE /api/services/:id - Eliminar un servicio (soft delete, scoped by account)
   */
  async delete(req: DualAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.accountId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      // Verify service belongs to account
      const existingService = await prisma.service.findFirst({
        where: { id, accountId: req.accountId },
      });

      if (!existingService) {
        res.status(404).json({ error: 'Servicio no encontrado' });
        return;
      }

      // Soft delete: marcar como inactivo en lugar de eliminar
      const service = await prisma.service.update({
        where: { id },
        data: { active: false },
      });

      res.json({ message: 'Servicio eliminado', service });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: handleDatabaseError(error) });
    }
  }
}

export const servicesController = new ServicesController();
