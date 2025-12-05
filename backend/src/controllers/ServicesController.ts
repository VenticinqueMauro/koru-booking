import { Request, Response } from 'express';
import { prisma, handleDatabaseError } from '../utils/database.js';
import { CreateServiceSchema, UpdateServiceSchema } from '../models/types.js';
import { ZodError } from 'zod';

export class ServicesController {
  /**
   * GET /api/services - Obtener todos los servicios activos
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const services = await prisma.service.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });

      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Error al cargar servicios' });
    }
  }

  /**
   * GET /api/services/:id - Obtener un servicio específico
   */
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const service = await prisma.service.findUnique({
        where: { id },
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
   * POST /api/services - Crear un nuevo servicio
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateServiceSchema.parse(req.body);

      const service = await prisma.service.create({
        data: validatedData,
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
   * PUT /api/services/:id - Actualizar un servicio
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateServiceSchema.parse(req.body);

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
   * DELETE /api/services/:id - Eliminar un servicio (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

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
