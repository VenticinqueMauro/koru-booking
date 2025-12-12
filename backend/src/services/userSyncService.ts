/**
 * User Synchronization Service
 * Syncs Koru users with local database
 */

import { PrismaClient } from '@prisma/client';
import { extractKoruUserInfo, decodeJwtWithoutVerification } from '../utils/jwtDecoder.js';
import { accountInitService } from './accountInitService.js';

const prisma = new PrismaClient();

export interface SyncedUser {
    user: {
        id: string;
        email: string;
        username: string | null;
        role: string;
        name: string | null;
        koruUserId: string | null;
        accountId: string | null;
    };
    account: {
        id: string;
        websiteId: string;
        appId: string;
        businessName: string | null;
    } | null;
}

export class UserSyncService {
    /**
     * Sync a Koru user to local database
     * Creates Account and User if they don't exist
     * Updates lastLoginAt on every login
     */
    async syncKoruUser(koruToken: string): Promise<SyncedUser | null> {
        try {
            // Extract user info from Koru JWT
            const userInfo = extractKoruUserInfo(koruToken);

            if (!userInfo.koruUserId) {
                console.error('Cannot sync user: koruUserId not found in token');
                return null;
            }

            // Decode full JWT to get additional info
            const decoded = decodeJwtWithoutVerification(koruToken);

            // Extract websiteId and appId (required for Account)
            const websiteId = userInfo.websiteId || decoded?.website_id || decoded?.websiteId;
            const appId = userInfo.appId || decoded?.app_id || decoded?.appId;

            if (!websiteId || !appId) {
                console.error('Cannot sync user: websiteId or appId not found in token');
                return null;
            }

            // Find or create Account using accountInitService
            const account = await accountInitService.findOrCreateAccount(
                websiteId,
                appId,
                {
                    businessName: decoded?.businessName || null,
                    email: userInfo.email || null,
                    config: {},
                }
            );

            // Update notifyEmail if it's still the default placeholder and we have a real email
            if (userInfo.email) {
                const settings = await prisma.widgetSettings.findUnique({
                    where: { accountId: account.id },
                    select: { notifyEmail: true },
                });

                if (settings?.notifyEmail === 'admin@example.com') {
                    await prisma.widgetSettings.update({
                        where: { accountId: account.id },
                        data: { notifyEmail: userInfo.email },
                    });
                    console.log(`✅ Updated notifyEmail to ${userInfo.email} for Account: ${account.id}`);
                }
            }

            // Find or create User
            let user = await prisma.user.findUnique({
                where: { koruUserId: userInfo.koruUserId },
            });

            if (!user) {
                // Create new user linked to account
                user = await prisma.user.create({
                    data: {
                        email: userInfo.email || `${userInfo.username}@koru.user`,
                        username: userInfo.username,
                        koruUserId: userInfo.koruUserId,
                        name: decoded?.name || userInfo.username || null,
                        role: 'client', // Default role for Koru users
                        accountId: account.id,
                        passwordHash: null, // Koru users don't have local password
                        active: true,
                        lastLoginAt: new Date(),
                    },
                });

                console.log(`✅ Created new User: ${user.id} (koruUserId: ${userInfo.koruUserId})`);
            } else {
                // Update lastLoginAt and account link if changed
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                        accountId: account.id, // Update account link if it changed
                        username: userInfo.username || user.username,
                        email: userInfo.email || user.email,
                    },
                });

                console.log(`✅ Updated User login: ${user.id}`);
            }

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    koruUserId: user.koruUserId,
                    accountId: user.accountId,
                },
                account: {
                    id: account.id,
                    websiteId: account.websiteId,
                    appId: account.appId,
                    businessName: account.businessName,
                },
            };
        } catch (error) {
            console.error('Error syncing Koru user:', error);
            return null;
        }
    }

    /**
     * Get user by Koru user ID
     */
    async getUserByKoruId(koruUserId: string) {
        return await prisma.user.findUnique({
            where: { koruUserId },
            include: {
                account: true,
            },
        });
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
            include: {
                account: true,
            },
        });
    }
}

export const userSyncService = new UserSyncService();
