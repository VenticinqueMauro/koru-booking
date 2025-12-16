import { Response } from 'express';
import { SuperAdminRequest } from '../middleware/superAdminAuth.js';
import { superAdminService } from '../services/superAdminService.js';
import { prisma } from '../utils/database.js';

export class SuperAdminController {
    /**
     * Get all accounts
     */
    async getAllAccounts(req: SuperAdminRequest, res: Response): Promise<void> {
        try {
            const accounts = await superAdminService.getAllAccounts();
            res.json(accounts);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            res.status(500).json({ error: 'Error fetching accounts' });
        }
    }

    /**
     * Get global statistics
     */
    async getGlobalStats(req: SuperAdminRequest, res: Response): Promise<void> {
        try {
            const stats = await superAdminService.getGlobalStats();
            res.json(stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Error fetching statistics' });
        }
    }

    /**
     * Get services for a specific account
     */
    async getAccountServices(req: SuperAdminRequest, res: Response): Promise<void> {
        try {
            const { accountId } = req.params;

            const services = await prisma.service.findMany({
                where: { accountId, active: true },
                orderBy: { name: 'asc' },
            });

            res.json(services);
        } catch (error) {
            console.error('Error fetching account services:', error);
            res.status(500).json({ error: 'Error fetching services' });
        }
    }

    /**
     * Get bookings for a specific account
     */
    async getAccountBookings(req: SuperAdminRequest, res: Response): Promise<void> {
        try {
            const { accountId } = req.params;

            const bookings = await prisma.booking.findMany({
                where: { accountId },
                include: {
                    service: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });

            res.json(bookings);
        } catch (error) {
            console.error('Error fetching account bookings:', error);
            res.status(500).json({ error: 'Error fetching bookings' });
        }
    }

    /**
     * Update account credentials and reference website
     */
    async updateAccount(req: SuperAdminRequest, res: Response): Promise<void> {
        try {
            const { accountId } = req.params;
            const { email, password, referenceWebsite } = req.body;

            const updatedAccount = await superAdminService.updateAccount(accountId, {
                email,
                password,
                referenceWebsite,
            });

            res.json(updatedAccount);
        } catch (error) {
            console.error('Error updating account:', error);
            res.status(500).json({ error: 'Error updating account' });
        }
    }
}

export const superAdminController = new SuperAdminController();
