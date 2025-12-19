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

export interface KoruUserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
}

export class UserSyncService {
    private koruAppId: string;

    constructor() {
        this.koruAppId = process.env.KORU_APP_ID || 'default-app';
    }

    /**
     * Sync a Koru user to local database
     * Creates Account and User if they don't exist
     * Updates lastLoginAt on every login
     *
     * @param koruToken - The Koru access token (for backwards compatibility or token storage)
     * @param userInfo - Direct user information from Koru response (preferred)
     * @param username - Username from login credentials (for fallback)
     */
    async syncKoruUser(
        koruToken: string,
        userInfo?: KoruUserInfo,
        username?: string
    ): Promise<SyncedUser | null> {
        try {
            let koruUserId: string;
            let email: string;
            let name: string | null;
            let websiteId: string | null = null;
            let appId: string | null = null;

            // Decode JWT to get websiteId and appId (always needed for account linking)
            const decoded = decodeJwtWithoutVerification(koruToken);

            let role: string = 'client'; // Default role

            if (userInfo) {
                // Use direct user info from new Koru response
                koruUserId = userInfo.id;
                email = userInfo.email;
                name = userInfo.name || username || null;
                // Use Koru role directly as source of truth
                role = userInfo.role || 'client';
            } else {
                // Fallback: Extract user info from Koru JWT (old method)
                const extractedInfo = extractKoruUserInfo(koruToken);

                if (!extractedInfo.koruUserId) {
                    console.error('Cannot sync user: koruUserId not found in token');
                    return null;
                }

                koruUserId = extractedInfo.koruUserId;
                email = extractedInfo.email || `${extractedInfo.username}@koru.user`;
                name = extractedInfo.username;
                websiteId = extractedInfo.websiteId;
                appId = extractedInfo.appId;
            }

            // Extract websiteId and appId (optional for new auth method)
            websiteId = websiteId || decoded?.website_id || decoded?.websiteId;
            appId = appId || decoded?.app_id || decoded?.appId;

            let account: any = null;

            // Only create/link account if we have websiteId and appId
            if (websiteId && appId) {
                // Find or create Account using accountInitService
                account = await accountInitService.findOrCreateAccount(
                    websiteId,
                    appId,
                    {
                        businessName: decoded?.businessName,
                        email: email,
                        config: {},
                    }
                );
            } else if (role !== 'admin') {
                // For non-admin users without websiteId/appId, try multiple strategies
                console.log(`⚠️  No websiteId/appId found for user ${koruUserId}. Looking for existing mapping.`);

                // Strategy 1: Check UserWebsiteMapping table
                const mapping = await prisma.userWebsiteMapping.findUnique({
                    where: { koruUserId },
                });

                if (mapping) {
                    console.log(`✅ Found mapping for user ${koruUserId}: websiteId=${mapping.websiteId}`);
                    websiteId = mapping.websiteId;
                    appId = mapping.appId;

                    // Find or create account with mapped websiteId
                    account = await accountInitService.findOrCreateAccount(
                        websiteId,
                        appId,
                        {
                            businessName: name || email,
                            email: email,
                            config: {},
                        }
                    );
                } else {
                    // Strategy 2: Check if user already exists and has an account
                    const existingUser = await prisma.user.findUnique({
                        where: { koruUserId },
                        include: { account: true },
                    });

                    if (existingUser?.account) {
                        // Use existing account and create mapping for future logins
                        account = existingUser.account;
                        console.log(`✅ Found existing account for user ${koruUserId}: ${account.id}`);

                        // Create mapping to speed up future logins
                        await prisma.userWebsiteMapping.upsert({
                            where: { koruUserId },
                            update: {
                                websiteId: account.websiteId,
                                appId: account.appId,
                            },
                            create: {
                                koruUserId,
                                websiteId: account.websiteId,
                                appId: account.appId,
                            },
                        });
                        console.log(`✅ Created mapping for future logins: ${koruUserId} → ${account.websiteId}`);
                    } else {
                        // Strategy 3: Create default account (last resort)
                        console.log(`⚠️  No existing account or mapping found for user ${koruUserId}. Creating default account.`);
                        const defaultWebsiteId = `koru-user-${koruUserId}`;
                        const defaultAppId = this.koruAppId || 'default-app';

                        account = await accountInitService.findOrCreateAccount(
                            defaultWebsiteId,
                            defaultAppId,
                            {
                                businessName: name || email,
                                email: email,
                                config: {},
                            }
                        );
                    }
                }
            }
            // For admins without websiteId/appId, account remains null

            // Update notifyEmail if it's still the default placeholder and we have a real email
            if (account && email && !email.includes('@koru.user')) {
                const settings = await prisma.widgetSettings.findUnique({
                    where: { accountId: account.id },
                    select: { notifyEmail: true },
                });

                if (settings?.notifyEmail === 'admin@example.com') {
                    await prisma.widgetSettings.update({
                        where: { accountId: account.id },
                        data: { notifyEmail: email },
                    });
                    console.log(`✅ Updated notifyEmail to ${email} for Account: ${account.id}`);
                }
            }

            // Find or create User
            let user = await prisma.user.findUnique({
                where: { koruUserId },
            });

            if (!user) {
                // Create new user linked to account (or null for super_admins)
                user = await prisma.user.create({
                    data: {
                        email,
                        username: username || name || email.split('@')[0],
                        koruUserId,
                        name,
                        role, // Map Koru role to local role (admin -> super_admin)
                        accountId: account?.id || null,
                        passwordHash: null, // Koru users don't have local password
                        active: true,
                        lastLoginAt: new Date(),
                    },
                });

                console.log(`✅ Created new User: ${user.id} (koruUserId: ${koruUserId}, role: ${role})`);
            } else {
                // Update lastLoginAt, account link, and user info if changed
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                        accountId: account?.id || user.accountId, // Update account link if it changed, or keep existing
                        username: username || user.username,
                        email: email || user.email,
                        name: name || user.name,
                        role, // Update role in case it changed in Koru
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
