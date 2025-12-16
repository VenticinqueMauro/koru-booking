import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database.js';
import { EmailPasswordCredentials, AuthenticatedUser } from '../types/auth.js';

export class SuperAdminService {
    private jwtSecret: string;
    private jwtExpiresIn: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    }

    /**
     * Authenticate admin with email and password
     */
    async login(credentials: EmailPasswordCredentials): Promise<{ token: string; user: AuthenticatedUser }> {
        const user = await prisma.user.findUnique({
            where: { email: credentials.email },
        });

        if (!user || !user.active) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        if (!user.passwordHash) {
            throw new Error('Invalid credentials');
        }
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT token
        const token = this.generateToken(user.id, user.email, user.role);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role as 'admin' | 'super_admin',
                name: user.name || undefined,
            },
        };
    }

    /**
     * Create admin user (run once during setup)
     */
    async createSuperAdmin(email: string, password: string, name?: string): Promise<void> {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: 'super_admin',
                name,
                active: true,
            },
        });
    }

    generateToken(userId: string, email: string, role: string): string {
        return jwt.sign(
            { userId, email, role },
            this.jwtSecret,
            { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
        );
    }

    verifyToken(token: string): { userId: string; email: string; role: string } {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as any;
            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Get all accounts (admin only)
     */
    async getAllAccounts() {
        return prisma.account.findMany({
            where: { active: true },
            include: {
                _count: {
                    select: {
                        services: true,
                        bookings: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get aggregated statistics across all accounts
     */
    async getGlobalStats() {
        const [totalAccounts, totalServices, totalBookings, recentBookings] = await Promise.all([
            prisma.account.count({ where: { active: true } }),
            prisma.service.count({ where: { active: true } }),
            prisma.booking.count(),
            prisma.booking.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    service: true,
                    account: true,
                },
            }),
        ]);

        return {
            totalAccounts,
            totalServices,
            totalBookings,
            recentBookings,
        };
    }

    /**
     * Update account credentials and reference website
     */
    async updateAccount(
        accountId: string,
        data: { email?: string; password?: string; referenceWebsite?: string }
    ) {
        const updateData: any = {};

        if (data.email !== undefined) {
            updateData.email = data.email || null;
        }

        if (data.password && data.password.trim() !== '') {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        if (data.referenceWebsite !== undefined) {
            updateData.referenceWebsite = data.referenceWebsite || null;
        }

        return prisma.account.update({
            where: { id: accountId },
            data: updateData,
        });
    }
}

export const superAdminService = new SuperAdminService();
