/**
 * User Synchronization Service
 * Syncs Koru users with local database
 *
 * Uses KoruSuite Identity Broker response format:
 * - websites[] array provides direct website associations
 * - app_id provided directly in response
 * - user info (id, email, name, role) directly available
 */

import { PrismaClient } from '@prisma/client';
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
    availableWebsites: KoruWebsiteInfo[];
}

export interface KoruUserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface KoruWebsiteInfo {
    id: string;
    url: string;
}

export interface KoruLoginData {
    userInfo: KoruUserInfo;
    appId: string;
    websites: KoruWebsiteInfo[];
}

export class UserSyncService {
    /**
     * Sync a Koru user to local database using Identity Broker response
     * Creates Account and User if they don't exist
     * Updates lastLoginAt on every login
     *
     * @param koruToken - The Koru access token (stored for future validations)
     * @param loginData - Direct data from Koru response (userInfo, appId, websites)
     * @param username - Username from login credentials (for display)
     */
    async syncKoruUser(
        koruToken: string,
        loginData: KoruLoginData,
        username?: string
    ): Promise<SyncedUser | null> {
        try {
            const { userInfo, appId, websites } = loginData;

            const koruUserId = userInfo.id;
            const email = userInfo.email;
            const name = userInfo.name || username || null;
            const role = userInfo.role || 'client';

            console.log(`🔐 Syncing Koru user: ${koruUserId} (${email}), role: ${role}`);
            console.log(`📍 Available websites: ${websites.length}`, websites.map(w => w.url));

            let account: any = null;

            // Link account based on websites from Koru response
            if (websites.length > 0) {
                // Use first website (multi-website selector can be added later)
                const primaryWebsite = websites[0];

                console.log(`✅ Using website: ${primaryWebsite.id} (${primaryWebsite.url})`);

                // Find or create Account
                account = await accountInitService.findOrCreateAccount(
                    primaryWebsite.id,
                    appId,
                    {
                        businessName: name || email,
                        email: email,
                        referenceWebsite: primaryWebsite.url,
                        config: {},
                    }
                );

                // Update reference website URL if changed
                if (account && primaryWebsite.url && account.referenceWebsite !== primaryWebsite.url) {
                    await prisma.account.update({
                        where: { id: account.id },
                        data: { referenceWebsite: primaryWebsite.url },
                    });
                    console.log(`✅ Updated referenceWebsite to ${primaryWebsite.url}`);
                }
            } else if (role !== 'admin') {
                // Non-admin users MUST have at least one website
                console.error(`❌ User ${koruUserId} has no websites assigned in Koru`);
                throw new Error('User has no websites assigned. Please contact your administrator.');
            }
            // Admins without websites have system-wide access (account = null)

            // Update notifyEmail if it's still the default placeholder
            if (account && email) {
                const settings = await prisma.widgetSettings.findUnique({
                    where: { accountId: account.id },
                    select: { notifyEmail: true },
                });

                if (settings?.notifyEmail === 'admin@example.com') {
                    await prisma.widgetSettings.update({
                        where: { accountId: account.id },
                        data: { notifyEmail: email },
                    });
                    console.log(`✅ Updated notifyEmail to ${email}`);
                }
            }

            // Find or create User
            let user = await prisma.user.findUnique({
                where: { koruUserId },
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        username: username || name || email.split('@')[0],
                        koruUserId,
                        name,
                        role,
                        accountId: account?.id || null,
                        passwordHash: null,
                        active: true,
                        lastLoginAt: new Date(),
                    },
                });

                console.log(`✅ Created new User: ${user.id} (role: ${role})`);
            } else {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                        accountId: account?.id || user.accountId,
                        username: username || user.username,
                        email: email || user.email,
                        name: name || user.name,
                        role,
                    },
                });

                console.log(`✅ Updated User login: ${user.id} (role: ${role})`);
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
                account: account ? {
                    id: account.id,
                    websiteId: account.websiteId,
                    appId: account.appId,
                    businessName: account.businessName,
                } : null,
                availableWebsites: websites,
            };
        } catch (error) {
            console.error('Error syncing Koru user:', error);
            throw error;
        }
    }

    /**
     * Get user by Koru user ID
     */
    async getUserByKoruId(koruUserId: string) {
        return await prisma.user.findUnique({
            where: { koruUserId },
            include: { account: true },
        });
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
            include: { account: true },
        });
    }
}

export const userSyncService = new UserSyncService();
