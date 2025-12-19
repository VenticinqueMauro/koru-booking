/**
 * Account Initialization Service
 * Handles creation and setup of new accounts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AccountInitService {
    /**
     * Initialize default schedule for new account (Mon-Fri 9am-6pm, Sat-Sun closed)
     */
    async initializeDefaultSchedule(accountId: string): Promise<void> {
        const defaultSchedule = [
            { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '18:00' }, // Sunday
            { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '18:00' },  // Monday
            { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '18:00' },  // Tuesday
            { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '18:00' },  // Wednesday
            { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '18:00' },  // Thursday
            { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '18:00' },  // Friday
            { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '18:00' }, // Saturday
        ];

        await prisma.schedule.createMany({
            data: defaultSchedule.map((schedule) => ({
                ...schedule,
                accountId,
            })),
        });

        console.log(`✅ Initialized default schedule for Account: ${accountId}`);
    }

    /**
     * Initialize default services for new account
     */
    async initializeDefaultServices(accountId: string): Promise<void> {
        const defaultServices = [
            { name: 'Consulta General', duration: 30, price: 50, buffer: 5 },
            { name: 'Consulta Extendida', duration: 60, price: 80, buffer: 10 },
            { name: 'Primera Consulta', duration: 45, price: 0, buffer: 5 },
        ];

        await prisma.service.createMany({
            data: defaultServices.map((service) => ({
                ...service,
                accountId,
                active: true,
            })),
        });

        console.log(`✅ Initialized default services for Account: ${accountId}`);
    }

    /**
     * Initialize default widget settings for new account
     */
    async initializeWidgetSettings(
        accountId: string,
        accountEmail?: string,
        config?: Record<string, any>
    ): Promise<void> {
        // Extract config from Koru or use defaults
        const accentColor = config?.accentColor || config?.color || '#00C896';

        // Priority: 1) config.notifyEmail, 2) accountEmail, 3) config.email, 4) placeholder
        const notifyEmail = config?.notifyEmail || accountEmail || config?.email || 'admin@example.com';

        await prisma.widgetSettings.create({
            data: {
                accountId,
                layout: 'list',
                stepInterval: 30,
                accentColor,
                notifyEmail,
                timezone: 'America/Argentina/Buenos_Aires',
            },
        });

        console.log(`✅ Initialized widget settings for Account: ${accountId} (notifyEmail: ${notifyEmail})`);
    }

    /**
     * Create and initialize a new account
     * Called when widget or backoffice creates a new account
     */
    async createAndInitializeAccount(
        websiteId: string,
        appId: string,
        additionalData?: {
            businessName?: string;
            email?: string;
            config?: Record<string, any>;
        }
    ): Promise<any> {
        console.log(`🆕 Creating new Account for websiteId: ${websiteId}`);

        // Create account
        const account = await prisma.account.create({
            data: {
                websiteId,
                appId,
                businessName: additionalData?.businessName || null,
                email: additionalData?.email || null,
                active: true,
            },
        });

        console.log(`✅ Account created: ${account.id}`);

        // Initialize schedule
        await this.initializeDefaultSchedule(account.id);

        // Initialize default services
        await this.initializeDefaultServices(account.id);

        // Initialize widget settings with account email
        await this.initializeWidgetSettings(
            account.id,
            additionalData?.email || undefined,
            additionalData?.config
        );

        return account;
    }

    /**
     * Find or create account
     * Returns existing account or creates new one
     */
    async findOrCreateAccount(
        websiteId: string,
        appId: string,
        additionalData?: {
            businessName?: string;
            email?: string;
            config?: Record<string, any>;
        }
    ): Promise<any> {
        // Try to find existing account
        let account = await prisma.account.findUnique({
            where: { websiteId },
        });

        if (account) {
            console.log(`✅ Found existing Account: ${account.id}`);
            return account;
        }

        // Create new account if not found
        return await this.createAndInitializeAccount(websiteId, appId, additionalData);
    }
}

export const accountInitService = new AccountInitService();
