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
                // Find an existing account matching ANY of the user's websites + appId.
                // This is critical for multi-tenant correctness: always use the account
                // that was already created for the widget on the store, not blindly websites[0].
                const websiteIds = websites.map(w => w.id);
                // Search by websiteId only — intentionally NOT filtering by appId.
                // The backoffice login uses a different Koru app (app_id) than the widget,
                // so filtering by appId would miss the widget-created account.
                // Among multiple matches, prefer the account that has real WidgetSettings
                // (i.e. has services/bookings = was actually used), falling back to newest.
                const matchingAccounts = await prisma.account.findMany({
                    where: {
                        websiteId: { in: websiteIds },
                        active: true,
                    },
                    include: {
                        _count: { select: { services: true, bookings: true } },
                    },
                });

                // Sort: most activity first, then most recently updated
                matchingAccounts.sort((a, b) => {
                    const activityA = a._count.services + a._count.bookings;
                    const activityB = b._count.services + b._count.bookings;
                    if (activityB !== activityA) return activityB - activityA;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                });

                const existingAccount = matchingAccounts[0] ?? null;

                let primaryWebsite: KoruWebsiteInfo;

                if (existingAccount) {
                    account = existingAccount;
                    primaryWebsite = websites.find(w => w.id === existingAccount.websiteId) || websites[0];
                    console.log(`✅ Matched existing account ${account.id} via websiteId: ${account.websiteId}`);
                } else {
                    // No existing account found — create one using the first website
                    primaryWebsite = websites[0];
                    console.log(`🆕 No existing account found, creating with websiteId: ${primaryWebsite.id}`);
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
                }

                // Update referenceWebsite if changed
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

            // Fix notifyEmail if it's still a placeholder or was incorrectly set to a URL
            if (account && email) {
                const settings = await prisma.widgetSettings.findUnique({
                    where: { accountId: account.id },
                    select: { notifyEmail: true },
                });

                const isInvalidEmail = !settings?.notifyEmail ||
                    settings.notifyEmail === 'admin@example.com' ||
                    settings.notifyEmail.startsWith('http');

                if (isInvalidEmail) {
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
