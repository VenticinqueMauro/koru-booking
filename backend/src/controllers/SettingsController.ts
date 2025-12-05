import { Request, Response } from 'express';
import { prisma, handleDatabaseError } from '../utils/database.js';
import { UpdateWidgetSettingsSchema } from '../models/types.js';
import { ZodError } from 'zod';

export class SettingsController {

    /**
     * GET /api/settings - Obtener configuración del widget
     * Si no existe, devuelve valores por defecto sin crear en DB (o crea uno por defecto)
     */
    async get(req: Request, res: Response): Promise<void> {
        try {
            // Intentamos obtener la primera configuración encontrada
            const settings = await prisma.widgetSettings.findFirst();

            if (!settings) {
                // Si no existe, devolvemos defaults (coincidiendo con schema prisma)
                res.json({
                    layout: 'list',
                    stepInterval: 30,
                    accentColor: '#00C896',
                    notifyEmail: '',
                    timezone: 'America/Mexico_City'
                });
                return;
            }

            res.json(settings);
        } catch (error) {
            console.error('Error fetching settings:', error);
            res.status(500).json({ error: 'Error al cargar configuración' });
        }
    }

    /**
     * POST /api/settings - Guardar/Actualizar configuración
     */
    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = UpdateWidgetSettingsSchema.parse(req.body);

            // Verificamos si ya existe una configuración
            const existing = await prisma.widgetSettings.findFirst();

            let settings;
            if (existing) {
                settings = await prisma.widgetSettings.update({
                    where: { id: existing.id },
                    data: validatedData,
                });
            } else {
                settings = await prisma.widgetSettings.create({
                    data: validatedData,
                });
            }

            res.json(settings);
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ error: 'Datos inválidos', details: error.errors });
                return;
            }

            console.error('Error updating settings:', error);
            res.status(500).json({ error: handleDatabaseError(error) });
        }
    }
}

export const settingsController = new SettingsController();
