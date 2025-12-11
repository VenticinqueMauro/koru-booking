import { Response } from 'express';
import { prisma, handleDatabaseError } from '../utils/database.js';
import { UpdateWidgetSettingsSchema } from '../models/types.js';
import { ZodError } from 'zod';
import { DualAuthRequest } from '../middleware/dualAuth.js';

export class SettingsController {

    /**
     * GET /api/settings - Obtener configuración del widget (scoped by account)
     * Si no existe, devuelve valores por defecto sin crear en DB
     */
    async get(req: DualAuthRequest, res: Response): Promise<void> {
        try {
            if (!req.accountId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            // Intentamos obtener la configuración de la cuenta
            const settings = await prisma.widgetSettings.findUnique({
                where: { accountId: req.accountId },
            });

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
     * POST /api/settings - Guardar/Actualizar configuración (scoped by account)
     */
    async update(req: DualAuthRequest, res: Response): Promise<void> {
        try {
            if (!req.accountId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const validatedData = UpdateWidgetSettingsSchema.parse(req.body);

            // Verificamos si ya existe una configuración para esta cuenta
            const existing = await prisma.widgetSettings.findUnique({
                where: { accountId: req.accountId },
            });

            let settings;
            if (existing) {
                settings = await prisma.widgetSettings.update({
                    where: { id: existing.id },
                    data: validatedData,
                });
            } else {
                settings = await prisma.widgetSettings.create({
                    data: {
                        ...validatedData,
                        accountId: req.accountId,
                    },
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
